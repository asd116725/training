# 后端项目文档

后端使用 Spring Boot 4.0.6、Java 17、Maven Wrapper、Spring Web MVC、Spring Data JPA、Validation 和 MySQL。

## 环境要求

- Java 17+
- 本地 MySQL
- 不需要全局安装 Maven，项目自带 `./mvnw`

## 初始化数据库

```bash
mysql -u root -p < src/main/resources/db/init.sql
```

默认数据库名为 `training_carbon`。

## 环境变量

```bash
MYSQL_URL=jdbc:mysql://localhost:3306/training_carbon?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
MYSQL_USER=root
MYSQL_PASSWORD=你的密码
SERVER_PORT=8080
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_CONNECT_TIMEOUT_MS=5000
DEEPSEEK_READ_TIMEOUT_MS=28000
```

## 常用命令

```bash
./mvnw test
MYSQL_USER=root MYSQL_PASSWORD=你的密码 ./mvnw spring-boot:run
```

## 分层说明

- `model`：JPA 实体和枚举。
- `dto`：REST 接口入参和出参。
- `repository`：Spring Data JPA 数据访问。
- `service`：饮食计算、CRUD、推荐逻辑。
- `controller`：REST API。
- `resources/db/init.sql`：MySQL 初始化脚本。

## API 概览

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| `GET` | `/api/profile` | 查询个人档案 |
| `POST` | `/api/profile` | 保存个人档案 |
| `POST` | `/api/profile/daily-plan?cycleType=medium` | 计算每日饮食目标 |
| `GET` | `/api/foods` | 查询食材库 |
| `POST` | `/api/foods` | 新增食材 |
| `PUT` | `/api/foods/{id}` | 修改食材 |
| `DELETE` | `/api/foods/{id}` | 删除食材 |
| `GET` | `/api/meals?date=2026-06-08` | 查询某天餐食 |
| `POST` | `/api/meals/items` | 新增餐食明细 |
| `POST` | `/api/meals/items/batch` | 批量新增餐食明细 |
| `PUT` | `/api/meals/items/{id}` | 修改餐食明细 |
| `DELETE` | `/api/meals/items/{id}` | 删除餐食明细 |
| `DELETE` | `/api/meals?date=2026-06-08` | 清空某天餐食 |
| `GET` | `/api/cycle-macros` | 查询碳循环宏量配置 |
| `POST` | `/api/cycle-macros` | 保存碳循环宏量配置 |
| `POST` | `/api/recommendations/preview` | 生成补餐推荐 |
| `GET` | `/api/recommendation-prompts` | 查询推荐提示词 |
| `POST` | `/api/recommendation-prompts` | 新增推荐提示词 |
| `PUT` | `/api/recommendation-prompts/order` | 保存推荐提示词排序 |
| `PUT` | `/api/recommendation-prompts/{id}` | 修改推荐提示词 |
| `DELETE` | `/api/recommendation-prompts/{id}` | 删除推荐提示词 |

## DeepSeek 推荐

推荐服务会优先检查 `DEEPSEEK_API_KEY`。

- 未配置：返回空推荐并提示配置 API Key。
- 已配置：调用 DeepSeek Chat Completions 兼容接口，默认模型为 `deepseek-v4-pro`。
- 调用失败或返回餐次不完整：返回空推荐和错误摘要。

推荐返回格式：

```json
{
  "source": "deepseek",
  "summary": "已按剩余缺口生成练前餐建议。",
  "items": [
    {
      "meal": "preWorkout",
      "foodName": "米饭",
      "grams": 120,
      "calories": 139.2,
      "protein": 3.1,
      "carbs": 31.1,
      "fat": 0.4
    }
  ]
}
```
