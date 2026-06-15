package com.training.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

/** 数据库兼容升级器测试。 */
class SchemaUpgradeRunnerTest {

    /** 验证单位字段迁移保留每百克营养。 */
    @Test
    void shouldKeepFoodNutritionPer100gWhenMigratingUnits() {
        RecordingJdbcTemplate jdbcTemplate = new RecordingJdbcTemplate();
        jdbcTemplate.addColumn("foods", "id");
        jdbcTemplate.addColumn("meal_log_items", "id");

        SchemaUpgradeRunner runner = new SchemaUpgradeRunner(jdbcTemplate);

        runner.run(null);

        assertEquals(0, jdbcTemplate.countExecuted("protein = protein / 100"));
        assertEquals(1, jdbcTemplate.countExecuted("protein = protein * 100"));
        assertEquals(2, jdbcTemplate.countExecuted("quantity = grams"));
        assertTrue(jdbcTemplate.hasExecuted("TRIM(unit_name) = ''"));

        jdbcTemplate.clearSql();
        runner.run(null);

        assertEquals(0, jdbcTemplate.countExecuted("protein = protein / 100"));
        assertEquals(1, jdbcTemplate.countExecuted("protein = protein * 100"));
        assertEquals(1, jdbcTemplate.countExecuted("quantity = grams"));
        assertTrue(jdbcTemplate.hasExecuted("TRIM(unit_name) = ''"));
    }

    /** 记录 SQL 的 JDBC 测试替身。 */
    private static class RecordingJdbcTemplate extends JdbcTemplate {

        /** 已存在列集合。 */
        private final Set<String> columns = new HashSet<>();

        /** 已执行 SQL。 */
        private final List<String> sqls = new ArrayList<>();

        /** 添加已存在列。 */
        void addColumn(String tableName, String columnName) {
            columns.add(columnKey(tableName, columnName));
        }

        /** 清理 SQL 记录。 */
        void clearSql() {
            sqls.clear();
        }

        /** 判断是否执行过包含指定片段的 SQL。 */
        boolean hasExecuted(String sqlPart) {
            return sqls.stream().anyMatch(sql -> sql.contains(sqlPart));
        }

        /** 统计包含指定片段的 SQL 数量。 */
        long countExecuted(String sqlPart) {
            return sqls.stream().filter(sql -> sql.contains(sqlPart)).count();
        }

        /** 模拟单值查询。 */
        @Override
        public <T> T queryForObject(String sql, Class<T> requiredType, Object... args) {
            if (sql.contains("information_schema.columns")) {
                Integer result = columns.contains(columnKey(String.valueOf(args[0]), String.valueOf(args[1]))) ? 1 : 0;
                return requiredType.cast(result);
            }

            Integer result = 0;
            return requiredType.cast(result);
        }

        /** 模拟列表查询。 */
        @Override
        public <T> List<T> queryForList(String sql, Class<T> elementType, Object... args) {
            return List.of();
        }

        /** 模拟行查询。 */
        @Override
        public <T> List<T> query(String sql, RowMapper<T> rowMapper) {
            return List.of();
        }

        /** 记录执行语句并同步新增列。 */
        @Override
        public void execute(String sql) {
            sqls.add(sql);
            recordAddedColumn(sql);
        }

        /** 记录更新语句。 */
        @Override
        public int update(String sql) {
            sqls.add(sql);
            return 0;
        }

        /** 记录更新语句。 */
        @Override
        public int update(String sql, Object... args) {
            sqls.add(sql);
            return 0;
        }

        /** 兼容抽象签名。 */
        @Override
        public <T> T queryForObject(String sql, RowMapper<T> rowMapper, Object... args) {
            return null;
        }

        /** 兼容抽象签名。 */
        @Override
        public <T> T queryForObject(String sql, Object[] args, RowMapper<T> rowMapper) {
            return null;
        }

        /** 兼容抽象签名。 */
        @Override
        public <T> List<T> query(String sql, Object[] args, RowMapper<T> rowMapper) {
            return List.of();
        }

        /** 记录 ALTER TABLE ADD COLUMN 的列。 */
        private void recordAddedColumn(String sql) {
            String normalizedSql = sql.replaceAll("\\s+", " ").trim().toLowerCase(Locale.ROOT);
            String marker = "alter table ";
            int tableStart = normalizedSql.indexOf(marker);
            int addColumnIndex = normalizedSql.indexOf(" add column ");

            if (tableStart < 0 || addColumnIndex < 0) {
                return;
            }

            String tableName = normalizedSql.substring(tableStart + marker.length(), addColumnIndex).trim();
            String rest = normalizedSql.substring(addColumnIndex + " add column ".length()).trim();
            String columnName = rest.split("\\s+")[0];
            addColumn(tableName, columnName);
        }

        /** 获取列唯一键。 */
        private String columnKey(String tableName, String columnName) {
            return tableName + "." + columnName;
        }
    }
}
