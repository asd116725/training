package com.training.config;

import java.util.List;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import com.training.service.DefaultFoodCatalog;
import com.training.service.DefaultFoodCatalog.DefaultFood;

/** 本地数据库兼容升级器。 */
@Component
@Order(1)
public class SchemaUpgradeRunner implements ApplicationRunner {

    /** JDBC 工具。 */
    private final JdbcTemplate jdbcTemplate;

    /** 创建数据库兼容升级器。 */
    public SchemaUpgradeRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /** 启动后修复旧版唯一索引。 */
    @Override
    public void run(ApplicationArguments args) {
        boolean shouldMigrateLegacyFoodUnits = !columnExists("foods", "unit_name");
        boolean shouldMigrateLegacyMealUnits = !columnExists("meal_log_items", "quantity");
        addColumnIfMissing("foods", "user_id", "ALTER TABLE foods ADD COLUMN user_id BIGINT NULL");
        addColumnIfMissing("foods", "default_seed",
                "ALTER TABLE foods ADD COLUMN default_seed BIT NOT NULL DEFAULT 0");
        addColumnIfMissing("foods", "remark", "ALTER TABLE foods ADD COLUMN remark VARCHAR(255) NOT NULL DEFAULT ''");
        addColumnIfMissing("foods", "unit_name",
                "ALTER TABLE foods ADD COLUMN unit_name VARCHAR(20) NOT NULL DEFAULT '克'");
        addColumnIfMissing("foods", "unit_weight",
                "ALTER TABLE foods ADD COLUMN unit_weight DOUBLE NOT NULL DEFAULT 1");
        addColumnIfMissing("meal_log_items", "quantity",
                "ALTER TABLE meal_log_items ADD COLUMN quantity DOUBLE NOT NULL DEFAULT 0");
        addColumnIfMissing("meal_log_items", "unit_name",
                "ALTER TABLE meal_log_items ADD COLUMN unit_name VARCHAR(20) NOT NULL DEFAULT '克'");
        addColumnIfMissing("meal_logs", "cutting_cycle_type",
                "ALTER TABLE meal_logs ADD COLUMN cutting_cycle_type VARCHAR(40) NOT NULL DEFAULT 'MEDIUM'");
        addColumnIfMissing("meal_logs", "bulking_day_type",
                "ALTER TABLE meal_logs ADD COLUMN bulking_day_type VARCHAR(40) NOT NULL DEFAULT 'TRAINING'");
        ensureDefaultSeedColumnDefault();
        ensureUnitColumnDefaults();
        if (shouldMigrateLegacyFoodUnits) {
            migrateLegacyFoodUnits();
        }
        if (shouldMigrateLegacyMealUnits) {
            migrateLegacyMealUnits();
        }
        normalizeInvalidUnits();
        normalizeLegacyUnitFoodNutrition();
        normalizePerGramFoodNutrition();
        normalizeFoodNutritionScale();
        dropIndexIfExists("meal_logs", "uk_meal_logs_date_type");
        dropIndexIfExists("cycle_macro_settings", "cycle_type");
        dropUniqueIndexByColumns("meal_logs", "log_date,meal_type");
        dropUniqueIndexByColumns("cycle_macro_settings", "cycle_type");
        addIndexIfMissing("foods", "idx_foods_user_id", "ALTER TABLE foods ADD INDEX idx_foods_user_id (user_id)");
        addIndexIfMissing("user_profiles", "uk_user_profiles_user",
                "ALTER TABLE user_profiles ADD UNIQUE KEY uk_user_profiles_user (user_id)");
        addIndexIfMissing("meal_logs", "uk_meal_logs_user_date_type",
                "ALTER TABLE meal_logs ADD UNIQUE KEY uk_meal_logs_user_date_type (user_id, log_date, meal_type)");
        addIndexIfMissing("cycle_macro_settings", "uk_cycle_macro_settings_user_type",
                "ALTER TABLE cycle_macro_settings ADD UNIQUE KEY uk_cycle_macro_settings_user_type (user_id, cycle_type)");
        addForeignKeyIfMissing("foods", "fk_foods_user",
                "ALTER TABLE foods ADD CONSTRAINT fk_foods_user FOREIGN KEY (user_id) REFERENCES app_users (id)");
        migrateLegacyMealFoods();
        markExistingDefaultSeedFoods();
    }

    /** 首次新增单位字段时保留旧每百克营养。 */
    private void migrateLegacyFoodUnits() {
        jdbcTemplate.update("""
                UPDATE foods
                SET unit_name = '克',
                    unit_weight = 1
                """);
    }

    /** 首次新增数量字段时保留历史克重为录入数量。 */
    private void migrateLegacyMealUnits() {
        jdbcTemplate.update("""
                UPDATE meal_log_items
                SET quantity = grams,
                    unit_name = '克'
                """);
    }

    /** 扫描并修复历史空单位或无效单位重量。 */
    private void normalizeInvalidUnits() {
        jdbcTemplate.update("""
                UPDATE foods
                SET unit_name = '克',
                    unit_weight = 1
                WHERE unit_weight IS NULL OR unit_weight <= 0
                   OR unit_name IS NULL OR TRIM(unit_name) = ''
                """);
        jdbcTemplate.update("""
                UPDATE meal_log_items
                SET unit_name = '克'
                WHERE unit_name IS NULL OR TRIM(unit_name) = ''
                """);
        jdbcTemplate.update("""
                UPDATE meal_log_items
                SET quantity = grams
                WHERE quantity <= 0 AND grams > 0
                """);
    }

    /** 扫描并修复旧版非克单位的每单位营养。 */
    private void normalizeLegacyUnitFoodNutrition() {
        jdbcTemplate.update("""
                UPDATE foods
                SET protein = protein / unit_weight * 100,
                    carbs = carbs / unit_weight * 100,
                    fat = fat / unit_weight * 100,
                    calories = calories / unit_weight * 100
                WHERE unit_weight > 1
                  AND (protein > 1 OR carbs > 1 OR fat > 1 OR calories > 20)
                """);
    }

    /** 扫描并修复旧版每克入库营养。 */
    private void normalizePerGramFoodNutrition() {
        jdbcTemplate.update("""
                UPDATE foods
                SET protein = protein * 100,
                    carbs = carbs * 100,
                    fat = fat * 100,
                    calories = calories * 100
                WHERE protein <= 1
                  AND carbs <= 1
                  AND fat <= 1
                  AND calories <= 10
                """);
    }

    /** 扫描并保留食材营养字段三位小数。 */
    private void normalizeFoodNutritionScale() {
        jdbcTemplate.update("""
                UPDATE foods
                SET protein = ROUND(protein, 3),
                    carbs = ROUND(carbs, 3),
                    fat = ROUND(fat, 3),
                    calories = ROUND(calories, 3)
                """);
    }

    /** 标记历史默认补种食材。 */
    private void markExistingDefaultSeedFoods() {
        for (DefaultFood food : DefaultFoodCatalog.all()) {
            jdbcTemplate.update("""
                    UPDATE foods target
                    LEFT JOIN foods marked
                      ON marked.user_id = target.user_id
                     AND marked.name = target.name
                     AND marked.default_seed = 1
                    SET target.default_seed = 1
                    WHERE target.user_id IS NOT NULL
                      AND target.default_seed = 0
                      AND marked.id IS NULL
                      AND target.name = ?
                      AND target.unit_name = ?
                      AND target.unit_weight = ?
                      AND target.protein = ?
                      AND target.carbs = ?
                      AND target.fat = ?
                      AND target.calories = ?
                    """, food.name(), food.unitName(), food.unitWeight(), food.protein(), food.carbs(),
                    food.fat(), food.calories());
        }
    }

    /** 迁移历史餐食引用的旧公共食材到个人食材。 */
    private void migrateLegacyMealFoods() {
        List<LegacyMealFood> items = jdbcTemplate.query("""
                SELECT item.id AS item_id,
                       log.user_id AS user_id,
                       food.name AS name,
                       food.protein AS protein,
                       food.carbs AS carbs,
                       food.fat AS fat,
                       food.calories AS calories,
                       food.unit_name AS unit_name,
                       food.unit_weight AS unit_weight,
                       food.remark AS remark
                FROM meal_log_items item
                JOIN meal_logs log ON item.meal_log_id = log.id
                JOIN foods food ON item.food_id = food.id
                WHERE log.user_id IS NOT NULL
                  AND food.user_id IS NULL
        """, (rs, rowNum) -> new LegacyMealFood(rs.getLong("item_id"), rs.getLong("user_id"),
                rs.getString("name"), rs.getDouble("protein"), rs.getDouble("carbs"),
                rs.getDouble("fat"), rs.getDouble("calories"), rs.getString("unit_name"),
                rs.getDouble("unit_weight"), rs.getString("remark")));

        for (LegacyMealFood item : items) {
            Long foodId = findOrCreateUserFood(item);
            jdbcTemplate.update("UPDATE meal_log_items SET food_id = ? WHERE id = ?", foodId, item.itemId());
        }
    }

    /** 查询或复制用户食材。 */
    private Long findOrCreateUserFood(LegacyMealFood item) {
        List<Long> foodIds = jdbcTemplate.queryForList("""
                SELECT id
                FROM foods
                WHERE user_id = ?
                  AND name = ?
                  AND protein = ?
                  AND carbs = ?
                  AND fat = ?
                  AND calories = ?
                  AND unit_name = ?
                  AND unit_weight = ?
                  AND remark = ?
                ORDER BY id ASC
                LIMIT 1
                """, Long.class, item.userId(), item.name(), item.protein(), item.carbs(), item.fat(),
                item.calories(), item.unitName(), item.unitWeight(), item.remark());

        if (!foodIds.isEmpty()) {
            return foodIds.get(0);
        }

        jdbcTemplate.update("""
                INSERT INTO foods (user_id, name, protein, carbs, fat, calories, unit_name, unit_weight, remark, default_seed)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
                """, item.userId(), item.name(), item.protein(), item.carbs(), item.fat(), item.calories(),
                item.unitName(), item.unitWeight(), item.remark());
        return jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
    }

    /** 确保默认食材标记列有默认值。 */
    private void ensureDefaultSeedColumnDefault() {
        try {
            jdbcTemplate.execute("ALTER TABLE foods MODIFY COLUMN default_seed BIT NOT NULL DEFAULT 0");
        } catch (Exception ignored) {
        }
    }

    /** 确保单位字段有默认值。 */
    private void ensureUnitColumnDefaults() {
        try {
            jdbcTemplate.execute("ALTER TABLE foods MODIFY COLUMN unit_name VARCHAR(20) NOT NULL DEFAULT '克'");
            jdbcTemplate.execute("ALTER TABLE foods MODIFY COLUMN unit_weight DOUBLE NOT NULL DEFAULT 1");
            jdbcTemplate.execute("ALTER TABLE meal_log_items MODIFY COLUMN quantity DOUBLE NOT NULL DEFAULT 0");
            jdbcTemplate.execute("ALTER TABLE meal_log_items MODIFY COLUMN unit_name VARCHAR(20) NOT NULL DEFAULT '克'");
        } catch (Exception ignored) {
        }
    }

    /** 按旧列组合删除唯一索引。 */
    private void dropUniqueIndexByColumns(String tableName, String columns) {
        List<String> indexNames = jdbcTemplate.queryForList("""
                SELECT index_name
                FROM information_schema.statistics
                WHERE table_schema = DATABASE()
                  AND table_name = ?
                  AND non_unique = 0
                  AND index_name <> 'PRIMARY'
                GROUP BY index_name
                HAVING GROUP_CONCAT(column_name ORDER BY seq_in_index) = ?
                """, String.class, tableName, columns);

        indexNames.forEach(indexName -> dropIndexIfExists(tableName, indexName));
    }

    /** 删除已存在索引。 */
    private void dropIndexIfExists(String tableName, String indexName) {
        if (!indexExists(tableName, indexName)) {
            return;
        }

        try {
            jdbcTemplate.execute("ALTER TABLE " + tableName + " DROP INDEX " + indexName);
        } catch (Exception ignored) {
        }
    }

    /** 补充缺失列。 */
    private void addColumnIfMissing(String tableName, String columnName, String sql) {
        if (columnExists(tableName, columnName)) {
            return;
        }

        try {
            jdbcTemplate.execute(sql);
        } catch (Exception ignored) {
        }
    }

    /** 补充缺失索引。 */
    private void addIndexIfMissing(String tableName, String indexName, String sql) {
        if (indexExists(tableName, indexName)) {
            return;
        }

        try {
            jdbcTemplate.execute(sql);
        } catch (Exception ignored) {
        }
    }

    /** 补充缺失外键。 */
    private void addForeignKeyIfMissing(String tableName, String constraintName, String sql) {
        if (constraintExists(tableName, constraintName)) {
            return;
        }

        try {
            jdbcTemplate.execute(sql);
        } catch (Exception ignored) {
        }
    }

    /** 判断列是否存在。 */
    private boolean columnExists(String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(1)
                FROM information_schema.columns
                WHERE table_schema = DATABASE()
                  AND table_name = ?
                  AND column_name = ?
                """, Integer.class, tableName, columnName);
        return count != null && count > 0;
    }

    /** 判断索引是否存在。 */
    private boolean indexExists(String tableName, String indexName) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(1)
                FROM information_schema.statistics
                WHERE table_schema = DATABASE()
                  AND table_name = ?
                  AND index_name = ?
                """, Integer.class, tableName, indexName);
        return count != null && count > 0;
    }

    /** 判断约束是否存在。 */
    private boolean constraintExists(String tableName, String constraintName) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(1)
                FROM information_schema.table_constraints
                WHERE table_schema = DATABASE()
                  AND table_name = ?
                  AND constraint_name = ?
                """, Integer.class, tableName, constraintName);
        return count != null && count > 0;
    }

    /** 旧公共食材餐食引用。 */
    private record LegacyMealFood(Long itemId, Long userId, String name, double protein, double carbs, double fat,
            double calories, String unitName, double unitWeight, String remark) {
    }
}
