# 技术可行性评估报告

| 版本 | 日期 | 修改人 | 说明 |
| :--- | :--- | :--- | :--- |
| v1.0 | 2026-01-01 | Tech Lead | 初始版本 |

## 1. 评估目的
分析 Data API Platform 核心功能在现有技术栈下的实现可行性，识别技术风险。

## 2. 关键技术点评估

### 2.1 动态 API 生成与执行
*   **需求**: 用户在前端配置 SQL 或表结构，后端自动生成 API 接口。
*   **方案**:
    *   不生成实际代码文件，而是采用 **配置驱动 (Metadata Driven)** 模式。
    *   后端提供一个通用的 `ExecuteController`，根据 URL 匹配 API 配置 (Metadata)。
    *   利用模板引擎 (如 EJS/Handlebars) 结合参数动态拼接 SQL。
*   **可行性**: **高**。业界已有成熟实践 (如 Hasura, Dataway)。
*   **风险**: SQL 注入风险。
*   **对策**: 强制使用参数化查询 (PreparedStatement)，严禁直接拼接字符串；对注入点模式进行严格的正则校验。

### 2.2 大数据引擎对接 (MaxCompute)
*   **需求**: 直接查询 MaxCompute (ODPS) 数据。
*   **难点**: MaxCompute 查询延迟较高（秒级甚至分钟级），且非实时并发数据库。
*   **方案**:
    *   **异步查询**: 提交任务后返回 JobID，前端轮询状态。
    *   **缓存层**: 引入 Redis 缓存查询结果，设置 TTL。
    *   **MCQA**: 启用 MaxCompute Query Acceleration (MCQA) 加速小查询。
*   **可行性**: **中**。需要处理异步交互带来的前端复杂性。

### 2.3 数据血缘解析
*   **需求**: 自动分析 SQL 中的表依赖关系。
*   **方案**: 使用 SQL Parser (如 `dt-sql-parser` 或 `antlr4`) 解析 AST，提取 Table 和 Column 节点。
*   **可行性**: **高**。前端或后端均可实现 AST 解析。

## 3. 技术栈选型
*   **前端**: React 18 + TypeScript + Vite + Tailwind + Redux Toolkit。
*   **后端 (Mock/BFF)**: Node.js (MSW for mocking currently, NestJS for production)。
*   **可视化**: ECharts (血缘/图表)。
*   **编辑器**: Monaco Editor (SQL 编辑)。

## 4. 结论
核心技术路径清晰，无颠覆性技术障碍。MaxCompute 的查询延迟是主要体验瓶颈，需通过交互优化（异步/缓存）缓解。
