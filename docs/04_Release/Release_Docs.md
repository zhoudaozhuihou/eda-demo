# 发布阶段文档集

| 版本 | 日期 | 修改人 | 说明 |
| :--- | :--- | :--- | :--- |
| v1.0 | 2026-01-01 | DevOps | 初始版本 |

## 1. 上线 Checklist (Release Checklist)
- [ ] **代码评审 (Code Review)**: 所有 PR 已合并且通过 Review。
- [ ] **自动化测试**: CI 流水线 (Unit/Integration Tests) 100% 通过。
- [ ] **数据库变更**: SQL 脚本已在 Staging 环境验证，无破坏性变更。
- [ ] **配置检查**: 生产环境配置 (Env Vars) 已更新 (DB Host, API Keys)。
- [ ] **回滚方案**: 确认回滚镜像/版本号可用。
- [ ] **通知**: 已通知相关业务方停机维护窗口（如需）。

## 2. 灰度发布方案 (Gray Release Plan)
### 2.1 策略
*   **阶段一 (Internal)**: 仅对内部开发团队 (Role=Admin/Dev) 开放新功能。
*   **阶段二 (Beta)**: 开放给 10% 的种子用户 (White List)。
*   **阶段三 (Full)**: 全量开放。

### 2.2 实现方式
使用 Feature Flag (功能开关) 控制。
```typescript
if (featureFlags.isEnabled('new_api_builder', user.id)) {
  showNewBuilder();
}
```

## 3. 监控指标文档 (Monitoring Metrics)
| 指标名称 | 定义 | 告警阈值 | 处理预案 |
| :--- | :--- | :--- | :--- |
| **API Success Rate** | 成功请求数/总请求数 | < 99.5% | 检查错误日志，确认是否 DB 异常 |
| **API Latency P95** | 95% 请求的响应时间 | > 500ms | 检查慢 SQL，扩容 |
| **CPU Usage** | 容器 CPU 使用率 | > 80% | 自动扩容 (HPA) |
| **DB Connections** | 数据库连接池占用 | > 90% | 检查连接泄露 |

## 4. 应急预案 (Emergency Plan)
*   **场景 A: 数据库宕机** -> 切换至从库 (主从切换)，发布公告暂停写操作。
*   **场景 B: 严重 Bug 导致服务不可用** -> 一键回滚至上一稳定版本 (Rollback)。
*   **场景 C: 流量突增** -> 触发自动扩容，或开启 API 限流 (Rate Limiting) 保护核心服务。
