# 运营阶段文档集

| 版本 | 日期 | 修改人 | 说明 |
| :--- | :--- | :--- | :--- |
| v1.0 | 2026-01-01 | Product Ops | 初始版本 |

## 1. 数据埋点方案 (Analytics Plan)
### 1.1 目标
了解用户核心路径转化率，优化 API 构建体验。

### 1.2 关键埋点事件
| 事件 ID | 事件名称 | 触发时机 | 属性参数 |
| :--- | :--- | :--- | :--- |
| `visit_dashboard` | 访问仪表盘 | 页面加载完成 | `user_role` |
| `click_quick_action` | 点击快捷操作 | 点击卡片时 | `action_name` (e.g., datasets) |
| `create_api_start` | 开始创建 API | 点击"创建 API" | `entry_point` |
| `create_api_success` | API 创建成功 | 发布成功页加载 | `mode` (single/join), `duration` |
| `api_test_run` | 运行 API 测试 | 点击调试按钮 | `status` (success/fail), `latency` |

## 2. A/B 测试方案
*   **实验目标**: 验证"向导式构建"是否比"单页构建"转化率更高。
*   **分组**: 
    *   Group A (Control): 现有单页长表单。
    *   Group B (Variant): 分步向导 (Stepper)。
*   **指标**: API 创建完成率 (Completion Rate)。

## 3. 用户反馈收集机制
*   **被动收集**: 界面右下角悬浮 "Feedback" 按钮，支持截图反馈。
*   **主动调研**: 每季度对 Top 10 活跃用户进行回访。
*   **工单系统**: 集成内部工单系统，追踪 Bug 修复进度。

## 4. 产品迭代规划 (Roadmap)
### Q1: 基础夯实
*   上线 API 构建器 v1.0 (单表模式)。
*   打通 MaxCompute 数据源。
*   完成审计日志模块。

### Q2: 能力进阶
*   支持多表关联 (Join) 模式。
*   增加在线 SQL 调试器。
*   集成 OAuth2 鉴权。

### Q3: 生态扩展
*   开放 API 市场 (Marketplace)。
*   支持 GraphQL 协议。
*   推出 IDE 插件。
