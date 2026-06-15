# 碳训计划

一个面向个人使用的力量训练与碳循环减脂工具。项目分为 React 前端、Spring Boot 后端和本地 MySQL 数据库。

## 项目结构

```text
.
├── PROJECT_PLAN.md
├── README.md
├── frondend/
│   ├── README.md
│   └── src/
└── java/
    ├── README.md
    └── src/
```

## 已实现能力

- 录入性别、身高、体重、年龄、当前体脂率、目标体脂率和活动水平。
- 计算 BMR、TDEE、目标热量、蛋白质、碳水、脂肪和目标体重。
- 支持高碳日、中碳日、低碳日切换。
- 支持早餐、午餐、练前餐、练后餐、晚餐五餐记录。
- 支持维护食材库：名称、每百克蛋白质、碳水、脂肪、热量。
- 支持根据剩余营养缺口生成补餐推荐。
- 后端预留 DeepSeek 接口；未配置密钥时使用本地规则推荐。

## 快速启动

### 1. 初始化数据库

```bash
mysql -u root -p < java/src/main/resources/db/init.sql
```

### 2. 启动后端

```bash
cd java
MYSQL_USER=root MYSQL_PASSWORD=你的密码 ./mvnw spring-boot:run
```

### 3. 启动前端

```bash
cd frondend
source ~/.nvm/nvm.sh
nvm use 20.19.5
npm install
npm run dev
```

前端默认访问 `http://localhost:5173`，后端默认访问 `http://localhost:8080`。

## 计算说明

- BMR 使用 Mifflin-St Jeor 公式。
- TDEE 使用 `BMR * 活动系数`。
- 减脂热量按碳循环日做偏移：高碳日约 `-200 kcal`，中碳日约 `-450 kcal`，低碳日约 `-650 kcal`。
- 蛋白质默认按 `体重 * 2g` 估算。
- 脂肪按不同碳循环日设置，剩余热量分配给碳水。

## DeepSeek 配置

后端读取以下环境变量：

```bash
DEEPSEEK_API_KEY=你的密钥
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-pro
```

不配置 `DEEPSEEK_API_KEY` 时，推荐接口会自动使用本地规则。

## 后续建议

- 增加训练计划表：动作、组数、次数、重量、RPE 和历史曲线。
- 增加每周碳循环排班：训练日高/中碳，休息日低碳。
- 增加体重和体脂趋势图，用 7 日平均值避免日波动误导。
- 增加食材组合模板，例如“练后高碳餐”“低碳晚餐”。
- 增加 DeepSeek 提示词调试页，保存每次推荐的输入、输出和采纳结果。

## 注意事项

本项目输出是健身饮食规划参考，不替代医生、营养师或专业教练建议。
