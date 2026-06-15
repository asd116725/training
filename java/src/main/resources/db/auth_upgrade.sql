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
ALTER TABLE meal_logs ADD COLUMN user_id BIGINT NULL;
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
  protein DOUBLE NOT NULL,
  carbs DOUBLE NOT NULL,
  fat DOUBLE NOT NULL,
  calories DOUBLE NOT NULL
);

INSERT INTO default_seed_foods (name, protein, carbs, fat, calories) VALUES
('牛奶', 3.6, 5, 4, 70),
('虾', 20, 0, 0.5, 85),
('燕麦吐司', 8.7, 35.2, 5.5, 244),
('牛肉', 23, 0, 3, 120),
('蛋白粉', 73.1, 12.9, 3.5, 380),
('香蕉', 1.4, 22, 0.2, 93),
('蓝莓', 0.5, 14.5, 0.3, 57);

UPDATE foods target
JOIN default_seed_foods seed
  ON target.name = seed.name
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
