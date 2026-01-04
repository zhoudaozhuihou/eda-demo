# API 接口文档

| 版本 | 日期 | 修改人 | 说明 |
| :--- | :--- | :--- | :--- |
| v1.0 | 2026-01-01 | Backend Team | 初始版本 |

## 1. 说明
本文档定义 Data API Platform 管理端的 HTTP 接口规范。
*   **Base URL**: `/api/v1`
*   **Content-Type**: `application/json`

## 2. 接口列表

### 2.1 数据集 (Datasets)

#### 获取数据集列表
*   **GET** `/datasets`
*   **Query**: `page`, `pageSize`, `keyword`, `category`
*   **Response**:
    ```json
    {
      "code": 200,
      "data": {
        "list": [
          { "id": "1", "name": "user_orders", "source": "mysql_prod", ... }
        ],
        "total": 100
      }
    }
    ```

#### 创建数据集
*   **POST** `/datasets`
*   **Body**:
    ```json
    {
      "name": "user_orders",
      "sourceId": "src_001",
      "fields": [...]
    }
    ```

### 2.2 API 管理 (APIs)

#### 创建 API 草稿
*   **POST** `/apis`
*   **Body**:
    ```json
    {
      "name": "getUserInfo",
      "path": "/users/:id",
      "method": "GET",
      "mode": "single_table",
      "config": { ... }
    }
    ```

#### 发布 API
*   **POST** `/apis/{id}/publish`
*   **Body**: `{ "version": "1.0.1", "comment": "fix bug" }`

### 2.3 审批 (Approvals)

#### 提交申请
*   **POST** `/approvals`
*   **Body**:
    ```json
    {
      "type": "publish_api",
      "targetId": "api_123",
      "reason": "business requirement"
    }
    ```

#### 审批操作
*   **PUT** `/approvals/{id}/status`
*   **Body**: `{ "status": "approved", "comment": "ok" }`

## 3. 错误码规范
*   `200`: 成功
*   `400`: 参数错误
*   `401`: 未登录
*   `403`: 无权限
*   `500`: 服务器内部错误
*   `10001`: 数据源连接失败
*   `10002`: SQL 校验失败
