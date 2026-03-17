# API Platform

前端应用（Vite + React + TypeScript + Tailwind + Radix UI + MUI）。

原始设计稿：<https://www.figma.com/design/zO3QYxAjemm4Ot7uz8x4xI/API-Platform>

## 环境要求

- Node.js 18+（建议 20+）
- npm 9+

## 本地开发

- 安装依赖：`npm i`
- 启动开发：`npm run dev`
- 运行测试：`npm run test:run`
- 生产构建：`npm run build`

## 环境配置

本项目使用 `.env` 文件进行多环境配置管理。

### 配置文件结构

- `.env`: 基础配置（所有环境通用）
- `.env.development`: 开发环境配置
- `.env.staging`: 预发布环境配置
- `.env.production`: 生产环境配置
- `.env.example`: 配置示例模板（已提交到 Git）

**注意**：`.env` 及 `.env.*` 文件（除 example 外）均被 `.gitignore` 忽略，请勿提交包含敏感信息的配置文件。部署时请基于 `.env.example` 创建对应的环境配置文件。

### 常用命令

- **开发环境**
  - `npm run dev`: 启动本地开发服务器（使用 `.env.development`）
  - `npm run dev:staging`: 使用预发布配置启动开发服务器
  - `npm run dev:prod`: 使用生产配置启动开发服务器

- **构建部署**
  - `npm run build:dev`: 构建开发环境包
  - `npm run build:staging`: 构建预发布环境包
  - `npm run build`: 构建生产环境包（默认使用 `.env.production`）

- **预览**
  - `npm run preview`: 预览生产构建
  - `npm run preview:staging`: 预览预发布构建

### 配置项说明

所有客户端可访问的环境变量必须以 `VITE_` 开头。

| 变量名 | 说明 | 示例 |
|Data | Description | Example |
|---|---|---|
| `VITE_APP_NAME` | 应用名称 | "API Platform" |
| `VITE_API_BASE_URL` | 后端 API 根地址 | "https://api.example.com/v1" |
| `VITE_DEFAULT_LOCALE` | 默认语言 | "zh-CN" |
| `VITE_ENABLE_MOCK` | 是否启用 Mock 数据 | "true" / "false" |
| `VITE_ENABLE_ANALYTICS` | 是否启用统计分析 | "true" / "false" |
| `VITE_SENTRY_DSN` | Sentry 监控 DSN | "https://..." |

### 代码中使用配置

推荐使用 `src/config/env.ts` 模块获取配置，该模块提供了类型提示和运行时验证。

```typescript
import { env } from '@/config/env';

console.log(env.apiBaseUrl);
if (env.features.mock) {
  // ...
}
```

## Git 约定

- 忽略规则见：`.gitignore`
- 行尾/二进制规则见：`.gitattributes`
- 提交信息模板：`.gitmessage`
  - 启用方式：`git config commit.template .gitmessage`

## 文档索引

项目核心文档位于 `docs/` 目录下，分类如下：

- **需求文档**: `docs/01_Requirements/` (PRD, 竞品分析等)
- **设计文档**: `docs/02_Design/` (UI/UX 规范, MUI 迁移指南等)
- **开发文档**: `docs/03_Development/` (架构设计, API 文档, AI 交互指南等)
- **发布文档**: `docs/04_Release/`
- **运营文档**: `docs/05_Operation/`

详细管理规范请参考：[文档管理规范](docs/03_Development/Documentation_Standards.md)

你是一个资深全栈工程师，请帮我构建一个企业级低代码 SQL Builder Web 应用。

【目标】
用户通过 UI 选择数据库、表、字段，并构建多表 JOIN，自动生成 SQL。

【技术栈】
React + TypeScript + Material UI + TailwindCSS + Redux Toolkit
后端：FastAPI + PostgreSQL

【核心功能】
- 数据源选择
- 表选择（支持多选）
- JOIN 可视化构建（拖拽 + 连线）
- 字段选择
- WHERE 条件构建
- SQL 实时预览

【JOIN 规则（必须严格执行）】
- 必须存在主表
- 禁止循环 JOIN
- 每个 JOIN 必须有 ON 条件
- 禁止笛卡尔积
- JOIN 顺序必须可解析
- 自动生成表别名
- 所有字段必须带别名

【UI 布局】
- 左：表结构树
- 中：JOIN 画布
- 右：字段 + 条件
- 下：SQL 预览

【状态管理】
请使用 Redux 设计完整 Store

【后端】
请使用 FastAPI：
- /databases
- /tables
- /columns
- /generate-sql
- /validate-sql

【输出要求】
请输出：
1. 完整前端代码（组件化）
2. Redux 状态设计
3. 后端 API
4. SQL 生成核心逻辑
5. JOIN 校验算法
6. 示例运行代码

要求代码可运行、结构清晰、符合企业级规范
