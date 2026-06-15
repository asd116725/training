CREATE DATABASE IF NOT EXISTS training_carbon
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE training_carbon;

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
  default_seed BIT NOT NULL DEFAULT 0
);

CREATE TEMPORARY TABLE seed_foods (
  name VARCHAR(120) NOT NULL,
  unit_name VARCHAR(20) NOT NULL,
  unit_weight DOUBLE NOT NULL,
  protein DOUBLE NOT NULL,
  carbs DOUBLE NOT NULL,
  fat DOUBLE NOT NULL,
  calories DOUBLE NOT NULL
);

INSERT INTO seed_foods (name, unit_name, unit_weight, protein, carbs, fat, calories) VALUES
('牛奶', '克', 1, 0.036, 0.05, 0.04, 0.7),
('鲜奶吐司', '克', 1, 0.118, 0.491, 0.076, 3.15),
('酵母吐司', '克', 1, 0.08, 0.47, 0.023, 2.45),
('燕麦吐司', '克', 1, 0.087, 0.352, 0.055, 2.44),
('A2吐司', '克', 1, 0.074, 0.484, 0.127, 3.39),
('核桃全麦欧包', '克', 1, 0.184, 0.41, 0.128, 3.54),
('虾', '克', 1, 0.2, 0, 0.005, 0.85),
('花生油', '克', 1, 0, 0, 1, 8.84),
('鸡蛋（100g）', '克', 1, 0.1256, 0.0072, 0.0951, 1.43),
('鸡蛋（一个，60g）', '克', 1, 0.063, 0.006, 0.045, 0.67),
('去皮鸡腿', '克', 1, 0.2, 0, 0.042, 1.21),
('牛肉', '克', 1, 0.23, 0, 0.03, 1.2),
('蛋白粉', '克', 1, 0.731, 0.129, 0.035, 3.8),
('红薯', '克', 1, 0.016, 0.2, 0.001, 0.86),
('生米', '克', 1, 0.07, 0.8, 0.005, 3.56),
('熟米', '克', 1, 0.027, 0.282, 0.003, 1.3),
('100ml橙子美式', '克', 1, 0, 0.069, 0, 0.28),
('一杯橙C美式', '克', 1, 0, 0.29, 0, 1.17),
('带骨小黄鱼', '克', 1, 0.18, 0, 0.03, 1),
('大肉包', '克', 1, 0.086, 0.3, 0.124, 2.67),
('水煮土豆', '克', 1, 0.0175, 0.2, 0.001, 0.86),
('牛奶馒头', '克', 1, 0.09, 0.5, 0.04, 2.75),
('100ml沙拉酱', '克', 1, 0.017, 0.146, 0.158, 2.06),
('香蕉', '克', 1, 0.014, 0.22, 0.002, 0.93),
('每日坚果', '克', 1, 0.138, 0.328, 0.368, 5.28),
('蓝莓', '克', 1, 0.005, 0.145, 0.003, 0.57);

UPDATE foods target
JOIN seed_foods seed ON target.name = seed.name
SET target.protein = seed.protein,
    target.carbs = seed.carbs,
    target.fat = seed.fat,
    target.calories = seed.calories,
    target.unit_name = seed.unit_name,
    target.unit_weight = seed.unit_weight,
    target.default_seed = 0
WHERE target.user_id IS NULL;

INSERT INTO foods (name, unit_name, unit_weight, protein, carbs, fat, calories)
SELECT seed.name, seed.unit_name, seed.unit_weight, seed.protein, seed.carbs, seed.fat, seed.calories
FROM seed_foods seed
LEFT JOIN foods target ON target.name = seed.name AND target.user_id IS NULL
WHERE target.id IS NULL;

DROP TEMPORARY TABLE seed_foods;
