# 前端项目文档

前端使用最新 Vite + React + TypeScript，目录名按需求保留为 `frondend`。

## 环境要求

- Node.js `20.19+` 或 `22.12+`
- npm `10+`

本机可使用：

```bash
source ~/.nvm/nvm.sh
nvm use 20.19.5
```

## 常用命令

```bash
npm install
npm run dev
npm run build
npm run lint
```

## 页面结构

- `src/App.tsx`：主界面和交互状态。
- `src/domain.ts`：饮食计算、碳循环目标、餐食汇总和规则推荐。
- `src/App.css`：工具页面样式。
- `src/index.css`：全局设计变量和基础样式。

## 主要交互

- 修改个人信息后，热量表自动重新计算。
- 页面加载时会请求 `/api/foods` 读取后端 MySQL 食材库；后端不可用时回退本地缓存。
- 切换高碳日、中碳日、低碳日后，热量与三大营养素目标自动变化。
- 添加餐食后，今日已摄入和剩余缺口自动更新。
- 新增食材后，可立即用于五餐记录和补餐推荐。
- 点击“生成推荐”会请求 `/api/recommendations/preview`，后端不可用时使用前端本地规则兜底。

## 后端代理

`vite.config.ts` 已配置：

```ts
server: {
  proxy: {
    '/api': 'http://127.0.0.1:8080',
  },
}
```

开发时前端请求 `/api/...` 会自动转发到 Spring Boot 后端。
