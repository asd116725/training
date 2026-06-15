CREATE DATABASE IF NOT EXISTS training_carbon
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE training_carbon;

CREATE TABLE IF NOT EXISTS foods (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT,
  name VARCHAR(120) NOT NULL,
  protein DOUBLE NOT NULL DEFAULT 0,
  carbs DOUBLE NOT NULL DEFAULT 0,
  fat DOUBLE NOT NULL DEFAULT 0,
  calories DOUBLE NOT NULL DEFAULT 0,
  remark VARCHAR(255) NOT NULL DEFAULT '',
  default_seed BIT NOT NULL DEFAULT 0
);

CREATE TEMPORARY TABLE seed_foods (
  name VARCHAR(120) NOT NULL,
  protein DOUBLE NOT NULL,
  carbs DOUBLE NOT NULL,
  fat DOUBLE NOT NULL,
  calories DOUBLE NOT NULL
);

INSERT INTO seed_foods (name, protein, carbs, fat, calories) VALUES
('牛奶', 3.6, 5, 4, 70),
('鲜奶吐司', 11.8, 49.1, 7.6, 315),
('酵母吐司', 8, 47, 2.3, 245),
('燕麦吐司', 8.7, 35.2, 5.5, 244),
('A2吐司', 7.4, 48.4, 12.7, 339),
('核桃全麦欧包', 18.4, 41, 12.8, 354),
('虾', 20, 0, 0.5, 85),
('花生油', 0, 0, 100, 884),
('鸡蛋（100g）', 12.56, 0.72, 9.51, 143),
('鸡蛋（一个，60g）', 6.3, 0.6, 4.5, 67),
('去皮鸡腿', 20, 0, 4.2, 121),
('牛肉', 23, 0, 3, 120),
('蛋白粉', 73.1, 12.9, 3.5, 380),
('红薯', 1.6, 20, 0.1, 86),
('生米', 7, 80, 0.5, 356),
('熟米', 2.7, 28.2, 0.3, 130),
('100ml橙子美式', 0, 6.9, 0, 28),
('一杯橙C美式', 0, 29, 0, 117),
('带骨小黄鱼', 18, 0, 3, 100),
('大肉包', 8.6, 30, 12.4, 267),
('水煮土豆', 1.75, 20, 0.1, 86),
('牛奶馒头', 9, 50, 4, 275),
('100ml沙拉酱', 1.7, 14.6, 15.8, 206),
('香蕉', 1.4, 22, 0.2, 93),
('每日坚果', 13.8, 32.8, 36.8, 528),
('蓝莓', 0.5, 14.5, 0.3, 57);

UPDATE foods target
JOIN seed_foods seed ON target.name = seed.name
SET target.protein = seed.protein,
    target.carbs = seed.carbs,
    target.fat = seed.fat,
    target.calories = seed.calories,
    target.default_seed = 0
WHERE target.user_id IS NULL;

INSERT INTO foods (name, protein, carbs, fat, calories)
SELECT seed.name, seed.protein, seed.carbs, seed.fat, seed.calories
FROM seed_foods seed
LEFT JOIN foods target ON target.name = seed.name AND target.user_id IS NULL
WHERE target.id IS NULL;

DELETE target
FROM foods target
LEFT JOIN seed_foods seed ON target.name = seed.name
WHERE seed.name IS NULL AND target.user_id IS NULL;

DROP TEMPORARY TABLE seed_foods;
