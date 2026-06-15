USE training_carbon;

-- 现有库手动升级脚本：如果某些列或索引已存在，相关 Duplicate 提示可忽略。
-- 后端启动时也会自动补充邀请码，并尝试修复旧版唯一索引。

CREATE TABLE IF NOT EXISTS app_users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  phone VARCHAR(20) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invite_codes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(40) NOT NULL UNIQUE,
  enabled BIT NOT NULL DEFAULT 1,
  used_by_user_id BIGINT,
  used_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  token_hash VARCHAR(120) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE user_profiles ADD COLUMN user_id BIGINT NULL;
ALTER TABLE foods ADD COLUMN user_id BIGINT NULL;
ALTER TABLE foods ADD COLUMN default_seed BIT NOT NULL DEFAULT 0;
ALTER TABLE foods MODIFY COLUMN default_seed BIT NOT NULL DEFAULT 0;
SET @should_migrate_food_units = (
  SELECT COUNT(*) = 0
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'foods'
    AND column_name = 'unit_name'
);
SET @sql = IF(@should_migrate_food_units,
  'ALTER TABLE foods ADD COLUMN unit_name VARCHAR(20) NOT NULL DEFAULT ''克''',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @sql = IF((
  SELECT COUNT(*) = 0
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'foods'
    AND column_name = 'unit_weight'
), 'ALTER TABLE foods ADD COLUMN unit_weight DOUBLE NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
UPDATE foods
SET unit_name = '克',
    unit_weight = 1,
    protein = protein / 100,
    carbs = carbs / 100,
    fat = fat / 100,
    calories = calories / 100
WHERE @should_migrate_food_units = 1;
UPDATE foods
SET unit_name = '克',
    unit_weight = 1,
    protein = protein / 100,
    carbs = carbs / 100,
    fat = fat / 100,
    calories = calories / 100
WHERE unit_weight IS NULL OR unit_weight <= 0
   OR unit_name IS NULL OR TRIM(unit_name) = '';
UPDATE foods
SET protein = ROUND(protein, 3),
    carbs = ROUND(carbs, 3),
    fat = ROUND(fat, 3),
    calories = ROUND(calories, 3);
ALTER TABLE meal_logs ADD COLUMN user_id BIGINT NULL;
SET @should_migrate_meal_units = (
  SELECT COUNT(*) = 0
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'meal_log_items'
    AND column_name = 'quantity'
);
SET @sql = IF(@should_migrate_meal_units,
  'ALTER TABLE meal_log_items ADD COLUMN quantity DOUBLE NOT NULL DEFAULT 0',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET @sql = IF((
  SELECT COUNT(*) = 0
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'meal_log_items'
    AND column_name = 'unit_name'
), 'ALTER TABLE meal_log_items ADD COLUMN unit_name VARCHAR(20) NOT NULL DEFAULT ''克''', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
UPDATE meal_log_items
SET quantity = grams,
    unit_name = '克'
WHERE @should_migrate_meal_units = 1;
UPDATE meal_log_items
SET unit_name = '克'
WHERE unit_name IS NULL OR TRIM(unit_name) = '';
UPDATE meal_log_items
SET quantity = grams
WHERE quantity <= 0 AND grams > 0;
ALTER TABLE cycle_macro_settings ADD COLUMN user_id BIGINT NULL;
ALTER TABLE recommendation_prompts ADD COLUMN user_id BIGINT NULL;
ALTER TABLE recommendation_records ADD COLUMN user_id BIGINT NULL;

ALTER TABLE meal_logs DROP INDEX uk_meal_logs_date_type;
ALTER TABLE cycle_macro_settings DROP INDEX cycle_type;

ALTER TABLE user_profiles ADD UNIQUE KEY uk_user_profiles_user (user_id);
ALTER TABLE foods ADD INDEX idx_foods_user_id (user_id);
ALTER TABLE meal_logs ADD UNIQUE KEY uk_meal_logs_user_date_type (user_id, log_date, meal_type);
ALTER TABLE cycle_macro_settings ADD UNIQUE KEY uk_cycle_macro_settings_user_type (user_id, cycle_type);
ALTER TABLE foods ADD CONSTRAINT fk_foods_user FOREIGN KEY (user_id) REFERENCES app_users (id);

CREATE TEMPORARY TABLE default_seed_foods (
  name VARCHAR(120) NOT NULL,
  unit_name VARCHAR(20) NOT NULL,
  unit_weight DOUBLE NOT NULL,
  protein DOUBLE NOT NULL,
  carbs DOUBLE NOT NULL,
  fat DOUBLE NOT NULL,
  calories DOUBLE NOT NULL
);

INSERT INTO default_seed_foods (name, unit_name, unit_weight, protein, carbs, fat, calories) VALUES
('牛奶', '克', 1, 0.036, 0.05, 0.04, 0.7),
('虾', '克', 1, 0.2, 0, 0.005, 0.85),
('燕麦吐司', '克', 1, 0.087, 0.352, 0.055, 2.44),
('牛肉', '克', 1, 0.23, 0, 0.03, 1.2),
('蛋白粉', '克', 1, 0.731, 0.129, 0.035, 3.8),
('香蕉', '克', 1, 0.014, 0.22, 0.002, 0.93),
('蓝莓', '克', 1, 0.005, 0.145, 0.003, 0.57);

UPDATE foods target
JOIN default_seed_foods seed
  ON target.name = seed.name
 AND target.unit_name = seed.unit_name
 AND target.unit_weight = seed.unit_weight
 AND target.protein = seed.protein
 AND target.carbs = seed.carbs
 AND target.fat = seed.fat
 AND target.calories = seed.calories
LEFT JOIN foods marked
  ON marked.user_id = target.user_id
 AND marked.name = target.name
 AND marked.default_seed = 1
SET target.default_seed = 1
WHERE target.user_id IS NOT NULL
  AND target.default_seed = 0
  AND marked.id IS NULL;

DROP TEMPORARY TABLE default_seed_foods;
