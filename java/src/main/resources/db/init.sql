CREATE DATABASE IF NOT EXISTS training_carbon
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE training_carbon;

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
  used_at TIMESTAMP NULL,
  CONSTRAINT fk_invite_codes_user FOREIGN KEY (used_by_user_id) REFERENCES app_users (id)
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  token_hash VARCHAR(120) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_auth_sessions_user FOREIGN KEY (user_id) REFERENCES app_users (id)
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT,
  gender VARCHAR(20) NOT NULL,
  height DOUBLE NOT NULL,
  weight DOUBLE NOT NULL,
  age INT NOT NULL,
  body_fat DOUBLE NOT NULL,
  target_body_fat DOUBLE NOT NULL,
  activity_level DOUBLE NOT NULL,
  UNIQUE KEY uk_user_profiles_user (user_id),
  CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES app_users (id)
);

CREATE TABLE IF NOT EXISTS foods (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT,
  name VARCHAR(120) NOT NULL,
  unit_name VARCHAR(20) NOT NULL DEFAULT '克',
  unit_weight DOUBLE NOT NULL DEFAULT 1,
  protein DOUBLE NOT NULL DEFAULT 0,
  carbs DOUBLE NOT NULL DEFAULT 0,
  fat DOUBLE NOT NULL DEFAULT 0,
  calories DOUBLE NOT NULL DEFAULT 0,
  remark VARCHAR(255) NOT NULL DEFAULT '',
  default_seed BIT NOT NULL DEFAULT 0,
  KEY idx_foods_user_id (user_id),
  CONSTRAINT fk_foods_user FOREIGN KEY (user_id) REFERENCES app_users (id)
);

CREATE TABLE IF NOT EXISTS cycle_macro_settings (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT,
  cycle_type VARCHAR(40) NOT NULL,
  carbs_per_kg DOUBLE NOT NULL DEFAULT 0,
  protein_per_kg DOUBLE NOT NULL DEFAULT 0,
  fat_per_kg DOUBLE NOT NULL DEFAULT 0,
  UNIQUE KEY uk_cycle_macro_settings_user_type (user_id, cycle_type),
  CONSTRAINT fk_cycle_macro_settings_user FOREIGN KEY (user_id) REFERENCES app_users (id)
);

CREATE TABLE IF NOT EXISTS meal_logs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT,
  log_date DATE NOT NULL,
  meal_type VARCHAR(40) NOT NULL,
  cutting_cycle_type VARCHAR(40) NOT NULL DEFAULT 'MEDIUM',
  bulking_day_type VARCHAR(40) NOT NULL DEFAULT 'TRAINING',
  UNIQUE KEY uk_meal_logs_user_date_type (user_id, log_date, meal_type),
  CONSTRAINT fk_meal_logs_user FOREIGN KEY (user_id) REFERENCES app_users (id)
);

CREATE TABLE IF NOT EXISTS meal_log_items (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  meal_log_id BIGINT NOT NULL,
  food_id BIGINT NOT NULL,
  quantity DOUBLE NOT NULL,
  unit_name VARCHAR(20) NOT NULL DEFAULT '克',
  grams DOUBLE NOT NULL,
  CONSTRAINT fk_meal_log_items_log FOREIGN KEY (meal_log_id) REFERENCES meal_logs (id),
  CONSTRAINT fk_meal_log_items_food FOREIGN KEY (food_id) REFERENCES foods (id)
);

CREATE TABLE IF NOT EXISTS recommendation_records (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT,
  source VARCHAR(40) NOT NULL,
  summary VARCHAR(1000),
  payload LONGTEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_recommendation_records_user FOREIGN KEY (user_id) REFERENCES app_users (id)
);

CREATE TABLE IF NOT EXISTS recommendation_prompts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT,
  title VARCHAR(100) NOT NULL,
  content LONGTEXT NOT NULL,
  sort_order INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_recommendation_prompts_user FOREIGN KEY (user_id) REFERENCES app_users (id)
);

INSERT INTO foods (name, unit_name, unit_weight, protein, carbs, fat, calories)
SELECT '鸡胸肉', '克', 1, 23, 0, 2, 110
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name = '鸡胸肉' AND user_id IS NULL);

INSERT INTO foods (name, unit_name, unit_weight, protein, carbs, fat, calories)
SELECT '鸡蛋', '克', 1, 13, 1, 10, 155
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name = '鸡蛋' AND user_id IS NULL);

INSERT INTO foods (name, unit_name, unit_weight, protein, carbs, fat, calories)
SELECT '米饭', '克', 1, 2.6, 25.9, 0.3, 116
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name = '米饭' AND user_id IS NULL);

INSERT INTO foods (name, unit_name, unit_weight, protein, carbs, fat, calories)
SELECT '燕麦', '克', 1, 16.9, 66.3, 6.9, 389
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name = '燕麦' AND user_id IS NULL);

INSERT INTO foods (name, unit_name, unit_weight, protein, carbs, fat, calories)
SELECT '红薯', '克', 1, 1.6, 20.1, 0.1, 86
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name = '红薯' AND user_id IS NULL);

INSERT INTO foods (name, unit_name, unit_weight, protein, carbs, fat, calories)
SELECT '三文鱼', '克', 1, 20, 0, 13, 208
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name = '三文鱼' AND user_id IS NULL);

INSERT INTO foods (name, unit_name, unit_weight, protein, carbs, fat, calories)
SELECT '西兰花', '克', 1, 2.8, 6.6, 0.4, 34
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name = '西兰花' AND user_id IS NULL);

INSERT INTO foods (name, unit_name, unit_weight, protein, carbs, fat, calories)
SELECT '橄榄油', '克', 1, 0, 0, 100, 884
WHERE NOT EXISTS (SELECT 1 FROM foods WHERE name = '橄榄油' AND user_id IS NULL);

INSERT INTO cycle_macro_settings (cycle_type, carbs_per_kg, protein_per_kg, fat_per_kg)
SELECT 'HIGH', 4.5, 2, 0.6
WHERE NOT EXISTS (SELECT 1 FROM cycle_macro_settings WHERE cycle_type = 'HIGH');

INSERT INTO cycle_macro_settings (cycle_type, carbs_per_kg, protein_per_kg, fat_per_kg)
SELECT 'MEDIUM', 3.3, 2, 0.75
WHERE NOT EXISTS (SELECT 1 FROM cycle_macro_settings WHERE cycle_type = 'MEDIUM');

INSERT INTO cycle_macro_settings (cycle_type, carbs_per_kg, protein_per_kg, fat_per_kg)
SELECT 'LOW', 1.5, 2, 0.9
WHERE NOT EXISTS (SELECT 1 FROM cycle_macro_settings WHERE cycle_type = 'LOW');
