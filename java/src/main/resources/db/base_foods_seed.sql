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
('牛奶', '克', 1, 3.6, 5, 4, 70),
('鲜奶吐司', '克', 1, 11.8, 49.1, 7.6, 315),
('酵母吐司', '克', 1, 8, 47, 2.3, 245),
('燕麦吐司', '克', 1, 8.7, 35.2, 5.5, 244),
('A2吐司', '克', 1, 7.4, 48.4, 12.7, 339),
('核桃全麦欧包', '克', 1, 18.4, 41, 12.8, 354),
('虾', '克', 1, 20, 0, 0.5, 85),
('花生油', '克', 1, 0, 0, 100, 884),
('鸡蛋（100g）', '克', 1, 12.56, 0.72, 9.51, 143),
('鸡蛋（一个，60g）', '克', 1, 6.3, 0.6, 4.5, 67),
('去皮鸡腿', '克', 1, 20, 0, 4.2, 121),
('牛肉', '克', 1, 23, 0, 3, 120),
('蛋白粉', '克', 1, 73.1, 12.9, 3.5, 380),
('红薯', '克', 1, 1.6, 20, 0.1, 86),
('生米', '克', 1, 7, 80, 0.5, 356),
('熟米', '克', 1, 2.7, 28.2, 0.3, 130),
('100ml橙子美式', '克', 1, 0, 6.9, 0, 28),
('一杯橙C美式', '克', 1, 0, 29, 0, 117),
('带骨小黄鱼', '克', 1, 18, 0, 3, 100),
('大肉包', '克', 1, 8.6, 30, 12.4, 267),
('水煮土豆', '克', 1, 1.75, 20, 0.1, 86),
('牛奶馒头', '克', 1, 9, 50, 4, 275),
('100ml沙拉酱', '克', 1, 1.7, 14.6, 15.8, 206),
('香蕉', '克', 1, 1.4, 22, 0.2, 93),
('每日坚果', '克', 1, 13.8, 32.8, 36.8, 528),
('蓝莓', '克', 1, 0.5, 14.5, 0.3, 57);

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
