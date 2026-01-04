# 技术方案设计文档

| 版本 | 日期 | 修改人 | 说明 |
| :--- | :--- | :--- | :--- |
| v1.0 | 2026-01-01 | Architect | 初始版本 |

## 1. 系统架构

### 1.1 总体架构图
采用前后端分离架构，后端采用微服务或模块化单体设计。

```mermaid
graph TD
    Client[浏览器/客户端] --> LB[负载均衡 Nginx]
    LB --> Gateway[API 网关 / BFF]
    
    subgraph "应用层 (Node.js/Java)"
        Gateway --> Auth[认证服务]
        Gateway --> Meta[元数据服务]
        Gateway --> Engine[查询引擎]
        Gateway --> Audit[审计服务]
    end
    
    subgraph "存储层"
        Meta --> MySQL[配置库 (MySQL)]
        Engine --> Redis[结果缓存]
        Audit --> ES[审计日志 (Elasticsearch)]
    end
    
    subgraph "数据源层"
        Engine --> DB1[(业务库 MySQL)]
        Engine --> DB2[(数仓 MaxCompute)]
        Engine --> DB3[(MongoDB)]
    end
```

### 1.2 模块划分
1.  **Metadata Service**: 管理 Dataset, API, DataSource 的 CRUD。
2.  **Query Engine**: 核心模块。负责 SQL 解析、参数注入、路由分发、结果脱敏。
3.  **Governance Service**: 负责审批流、权限校验、版本管理。

## 2. 核心流程设计

### 2.1 API 调用流程
1.  **Request**: 客户端请求 `GET /api/v1/data/{api_path}`。
2.  **Auth**: 网关校验 API Key / Token。
3.  **Load Config**: 查询引擎从缓存/DB 加载 API 配置（SQL 模板、数据源信息、脱敏规则）。
4.  **Rate Limit**: 检查 QPS 限流。
5.  **Execute**:
    *   渲染 SQL 模板。
    *   从连接池获取数据源连接。
    *   执行查询。
6.  **Process**:
    *   数据脱敏 (Masking)。
    *   结果缓存 (Set Cache)。
7.  **Response**: 返回 JSON 数据。
8.  **Log**: 异步写入审计日志。

## 3. 安全设计
*   **传输层**: 全链路 HTTPS。
*   **存储层**: 数据库密码使用 AES-256 加密存储。
*   **应用层**: 
    *   SQL 注入防护：PreparedStatement。
    *   XSS 防护：输入过滤。
    *   越权访问：RBAC + 资源所有权校验。
