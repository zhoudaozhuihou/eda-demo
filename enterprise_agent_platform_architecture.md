# 企业级 Agent 平台总体架构设计

> 基于 Deep Agents、LangChain、LangGraph、Langfuse、LLM Gateway、MCP、Skill Registry 与企业治理体系  
> 文档版本：v1.0  
> 日期：2026-07-21

---

## 1. 文档目标

本文设计一套完整的企业级 Agent 平台架构，用于支持复杂业务 Agent 的设计、开发、运行、治理和持续优化。

核心技术组合：

```text
Deep Agents
+ LangChain
+ LangGraph
+ Langfuse
+ LLM Gateway
+ MCP / Enterprise Tools
+ Skill Registry
+ Memory / Knowledge / Artifact Backends
+ Enterprise Security & Governance
```

重点解决：

1. Deep Agents、LangChain、LangGraph、Langfuse 如何协同。
2. Agent、Workflow、Tool、Skill、Memory、Knowledge 和 Backend 如何分层。
3. 如何实现可恢复、可审批、可观测、可评估的生产级 Agent。
4. 如何满足多租户、权限、审计、数据隔离和安全要求。
5. 如何组织真实项目代码与部署架构。
6. 如何从 MVP 演进到企业级 Agent Platform。

---

## 2. 设计原则

### 2.1 确定性流程与非确定性智能分离

```text
LangGraph
负责确定性、可审计、可恢复的业务流程

Deep Agents
负责非确定性、探索式、复杂多步骤智能任务
```

推荐模式：

```text
LangGraph 主流程
  ↓
部分 Node 调用 Deep Agent
  ↓
Deep Agent 返回结构化结果
  ↓
LangGraph 继续验证、审批和发布
```

### 2.2 模型不能决定权限

模型只能在系统预先允许的 Tool、Skill、Knowledge 和数据范围内工作。权限必须由认证、租户、RBAC、ABAC 和 Tool Policy 在运行时强制执行。

### 2.3 所有有副作用操作必须可控

写数据库、发布标签、修改生产配置、删除数据、执行 Shell、提交代码等操作必须具备权限、幂等、审批、审计、重试和回滚或补偿能力。

### 2.4 Agent 资产与业务资产分离

```text
Agent Memory        保存偏好、经验和上下文
Skill Registry      保存可复用 Agent 能力
Knowledge Registry  保存企业知识资产
Business Registry   保存正式业务对象
LangGraph State     保存一次任务执行状态
```

### 2.5 所有运行必须可观测和可评估

每次 Agent Run 都应记录 Trace、Model Call、Tool Call、Skill/Workflow/Prompt 版本、Token、成本、延迟、审批、结果与 Eval Score。

---

## 3. 核心组件职责

### 3.1 Deep Agents：复杂任务 Agent Harness

负责：

- 自主规划与 Todo 管理
- Skill 渐进加载
- Memory 与 Filesystem
- Context Offloading 与自动摘要
- Subagent 与 Sandbox
- Human-in-the-loop
- 长任务处理

适合元数据探索、复杂分析、SQL 候选方案生成、文档报告生成、多来源研究和错误诊断。

不应直接承担正式审批状态机、生产发布事务、权限决策和强一致性业务流程。

### 3.2 LangChain：模型与能力抽象层

负责：

- Chat Model、Message、Prompt
- Tool、MCP Adapter
- Retriever、Embedding
- Structured Output
- Middleware、Callback
- Provider Integration

```text
Deep Agent
├── LangChain ChatModel
├── LangChain Tools
├── LangChain Middleware
├── LangChain Retriever
└── LangChain MCP Adapter
```

### 3.3 LangGraph：状态化工作流运行时

负责：

- State、Node、Edge、Conditional Routing
- Checkpoint、Persistence
- Retry、Interrupt、Resume
- Human Approval
- Streaming、Subgraph、Durable Execution

适合固定治理步骤、审批、发布、失败恢复和确定性步骤与 Agent 步骤混合。

### 3.4 Langfuse：可观测性、PromptOps 与 Eval

负责：

- Trace、Span、Generation
- Tool Observation
- Token、成本、延迟
- Prompt Version
- Dataset、Experiment
- Online/Offline Eval
- User Feedback、生产监控

Langfuse 不负责业务 Workflow、权限决策或正式业务资产存储。

### 3.5 LLM Gateway：模型供应商抽象

负责：

- OpenAI-compatible API
- 模型别名与切换
- Retry、Fallback、Load Balance
- Rate Limit、Timeout、Cost Policy
- Provider Credential、Usage Log

Agent 只使用逻辑模型名：

```text
fast-model
reasoning-model
coding-model
embedding-model
```

### 3.6 MCP 与 Enterprise Tools：真实能力连接层

连接 DataHub、BigQuery、MaxCompute、DataWorks、数据库、标签系统、API Catalog、DQ 平台、GitHub、Jira、Confluence、SharePoint 和审批系统。

---

## 4. 总体分层架构

```text
┌──────────────────────────────────────────────────────────────┐
│ Experience Layer                                            │
│ React Chat / Task Center / Approval / Artifact / Admin      │
└────────────────────────────┬─────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ API & Access Layer                                          │
│ FastAPI / API Gateway / SSO / JWT / Tenant / Rate Limit     │
└────────────────────────────┬─────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ Agent Control Plane                                         │
│ Agent / Workflow / Skill / Prompt / Tool Registry           │
│ Model Policy / Guardrail Policy / Release Policy             │
└────────────────────────────┬─────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────┐
│ Orchestration Layer                                         │
│ LangGraph: State / Checkpoint / Interrupt / Retry / Resume  │
└───────────────┬───────────────────────────────┬──────────────┘
                ▼                               ▼
┌──────────────────────────────┐  ┌────────────────────────────┐
│ Deep Agent Harness           │  │ Deterministic Services     │
│ Plan / Skill / Memory        │  │ Validation / Approval      │
│ Filesystem / Subagent        │  │ Publish / Audit / Policy   │
└──────────────┬───────────────┘  └──────────────┬─────────────┘
               └────────────────┬─────────────────┘
                                ▼
┌──────────────────────────────────────────────────────────────┐
│ Capability Layer                                            │
│ LangChain Models / Tools / MCP / Retriever / Middleware     │
└───────────────┬──────────────────────────────┬───────────────┘
                ▼                              ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│ LLM Gateway                  │ │ Enterprise Systems          │
│ Alias / Route / Retry        │ │ DB / API / Data / Git / DQ │
└──────────────────────────────┘ └─────────────────────────────┘

所有层统一产生 Trace、Metric、Audit、Eval
                                ▼
┌──────────────────────────────────────────────────────────────┐
│ Observability & Eval Layer                                  │
│ Langfuse / OpenTelemetry / Prometheus / Grafana             │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. 控制平面与数据平面

### 5.1 控制平面

保存 Agent 配置和治理资产：

- Agent Registry
- Workflow Registry
- Skill Registry
- Tool Registry
- Prompt Registry
- Model Policy
- Guardrail Policy
- Eval Dataset
- Release Policy

### 5.2 数据平面

负责实时运行：

```text
API Request
  ↓
Agent Router
  ↓
LangGraph Runtime
  ↓
Deep Agent / Tool
  ↓
Model / Enterprise System
```

---

## 6. Registry 设计

### 6.1 Agent Registry

```yaml
agent_id: tag-builder-agent
version: 1.3.0
status: stable
owner: tag-platform-team

model_policy:
  primary: reasoning-model
  fallback: fast-model

workflow:
  id: create-tag-workflow
  version: 2.1.0

skills:
  - tag-design@1.2.0
  - metadata-search@2.0.0
  - sql-generation@3.1.0

tools:
  - metadata_search
  - validate_sql
  - preview_data

permissions:
  roles:
    - tag_creator

runtime_policy:
  max_turns: 15
  timeout_seconds: 300
  max_cost_usd: 1.0
```

### 6.2 Workflow Registry

管理 LangGraph Workflow 的 State Schema、Node、Edge、Retry、Timeout、Interrupt、补偿策略、版本、Owner 和 Eval Dataset。

### 6.3 Skill Registry

```text
Skill
├── SKILL.md
├── manifest.yaml
├── references/
├── templates/
├── scripts/
└── evals/
```

大量 Skill 必须采用 Permission Filter、Domain Filter、关键词/向量召回、Rerank 和 Top-K 动态加载。

### 6.4 Tool Registry

```yaml
tool_id: publish_tag
version: 1.0.0
description: 发布已审批的标签版本
risk_level: high
side_effect: true
idempotent: true
requires_approval: true
permissions:
  - tag.publish
timeout_seconds: 30
retry:
  max_attempts: 2
```

### 6.5 Prompt Registry

统一管理 System Prompt、Node Prompt、Tool Instruction、Guardrail Prompt、Eval Prompt，以及版本、Owner、环境和发布状态。

---

## 7. 状态与存储设计

### 7.1 LangGraph State

```python
class TagState(TypedDict):
    request: str
    user_id: str
    tenant_id: str
    intent: str
    tag_definition: dict | None
    selected_tables: list[str]
    generated_sql: str | None
    validation_result: dict | None
    quality_result: dict | None
    approval_status: str
    publish_result: dict | None
    error: dict | None
```

### 7.2 Checkpointer

保存当前节点、Graph State、Message、Interrupt、Resume Point 和审批状态。生产建议使用 PostgreSQL Checkpointer。

### 7.3 Deep Agents Backend

推荐 CompositeBackend：

```text
/workspace/   → StateBackend
/memories/    → StoreBackend
/skills/      → SkillBackend
/knowledge/   → KnowledgeBackend
/artifacts/   → ObjectStorageBackend
/sandbox/     → SandboxBackend
```

### 7.4 Business Registry

正式标签、API、数据产品、知识资产等必须保存到业务 Registry，不能仅依赖 Agent Memory 或文件。

---

## 8. Memory 架构

### 8.1 Working Memory

保存当前 Run 的计划、中间结论、Tool Result 和临时文件。

### 8.2 Session Memory

保存当前会话主题、未完成任务、用户已确认信息和 Workflow 状态。

### 8.3 Long-term Memory

保存稳定偏好、业务约定、成功经验和已验证模式。写入前必须经过 Extraction、Validation、Conflict Detection、Permission Check。

### 8.4 Namespace

```text
tenant
└── user
    └── agent
        └── memory_type
```

---

## 9. Knowledge 架构

企业知识处理链路：

```text
Source Connector
  ↓
Raw Storage
  ↓
Parse / Normalize
  ↓
Metadata Enrichment
  ↓
Permission Mapping
  ↓
Chunk
  ↓
Embedding
  ↓
BM25 + Vector Index
  ↓
Rerank
  ↓
Agent Retrieval
```

必须支持文档 ACL、Tenant/Department Filter、敏感等级、来源引用、版本、新鲜度和 Owner。

---

## 10. Agent Router

负责：Intent、Domain、Risk、Tenant、Role、Agent、Workflow、Skill、Tool Set、Model 和 Knowledge Scope。

```yaml
intent: create_tag
domain: customer
risk: medium
agent: tag-builder-agent
workflow: create-tag-workflow
model: reasoning-model
skills:
  - tag-design
  - metadata-search
  - sql-generation
```

推荐“规则优先 + 分类模型 + Registry Filter + Fallback”。

---

## 11. 真实请求完整执行链路

用户请求：

```text
创建一个最近30天交易频率下降超过50%的客户标签
```

```text
1. React Chat：提交请求
2. API Gateway：JWT、限流、Request ID
3. FastAPI：解析 tenant_id、user_id、role
4. Agent Router：识别 create_tag
5. LangGraph：创建或恢复 Thread
6. Policy Node：校验 tag.create 权限
7. Deep Agent Node：加载 Skill、Memory、Knowledge
8. Deep Agent Planning：生成 Todo
9. Metadata Subagent：调用 DataHub/MCP
10. SQL Subagent：生成候选 SQL
11. Validation Node：解析、只读和字段校验
12. Preview Node：受控环境执行样本查询
13. Quality Node：覆盖率、空值、波动检查
14. Human Approval Interrupt：等待审批
15. Resume：按 thread_id 恢复
16. Publish Tool：幂等发布
17. Business Registry：保存正式版本
18. LangGraph：写入最终状态
19. Langfuse：记录完整 Trace
20. Eval Pipeline：评分完成度、轨迹、成本和安全
```

---

## 12. LangGraph 主流程

```text
START
  ↓
authenticate
  ↓
route_request
  ↓
authorize
  ↓
load_context
  ↓
design_with_deep_agent
  ↓
validate_output
  ↓
quality_check
  ↓
approval_interrupt
  ↓
publish
  ↓
audit
  ↓
END
```

原则：

```text
需要探索      → Deep Agent Node
需要确定性    → 普通 Service Node
有副作用      → Tool + Policy + Approval
需要恢复      → LangGraph Checkpoint
```

---

## 13. Deep Agent 内部结构

```text
Deep Agent
├── System Prompt
├── SkillsMiddleware
├── FilesystemMiddleware
├── MemoryMiddleware
├── SummarizationMiddleware
├── SubAgentMiddleware
├── HumanInTheLoopMiddleware
├── Custom Security Middleware
└── LangChain Tools
```

推荐 Subagent：Metadata Agent、SQL Agent、Quality Agent、Compliance Agent、Research Agent。

每个 Subagent 应独立上下文、最小 Tool 集、独立预算和超时，并返回结构化结果。

---

## 14. Tool 执行控制

```text
Tool Request
  ↓
Schema Validation
  ↓
Identity Validation
  ↓
Tenant Validation
  ↓
RBAC / ABAC
  ↓
Risk Classification
  ↓
Approval Check
  ↓
Idempotency Check
  ↓
Rate Limit
  ↓
Execution
  ↓
Output Filter
  ↓
Audit
```

| 类型 | 策略 |
|---|---|
| 只读查询 | 可并行 |
| 元数据查询 | 可并行 |
| 文件读取 | 可并行 |
| 数据修改 | 串行 |
| 生产发布 | 强制审批 |
| Shell | Sandbox |
| 高成本调用 | 预算控制 |
| 删除操作 | 双人复核 |

---

## 15. Guardrail 架构

### Input Guardrail

Prompt Injection、Tenant Scope、PII、非法意图、敏感请求、用户权限。

### Context Guardrail

Knowledge ACL、Memory Scope、Skill Permission、Tool Visibility、Cross-tenant Detection。

### Tool Guardrail

SQL/Command Injection、破坏性操作、副作用、参数校验和审批。

### Output Guardrail

PII/Secret Redaction、Citation、Schema、Hallucination Risk、敏感信息过滤。

---

## 16. Human-in-the-loop

```json
{
  "action": "publish_tag",
  "risk": "high",
  "arguments": {
    "tag_id": "customer_transaction_decline",
    "version": "1.0.0"
  },
  "reason": "标签已通过 SQL 和质量检查",
  "impact": "创建新的生产标签任务"
}
```

状态：PENDING、APPROVED、REJECTED、EXPIRED、CANCELLED。

---

## 17. LLM Gateway 设计

推荐接口：

```text
/v1/chat/completions
/v1/responses
/v1/embeddings
```

路由维度：任务类型、上下文长度、模型能力、成本、延迟、数据区域、供应商可用性。

---

## 18. Langfuse Trace 设计

```text
Trace: create-tag
├── API Request
├── Router
├── LangGraph Run
│   ├── Authorize
│   ├── Load Context
│   ├── Deep Agent
│   │   ├── Plan
│   │   ├── Metadata Subagent
│   │   │   └── metadata_search
│   │   ├── SQL Subagent
│   │   │   ├── model_call
│   │   │   └── validate_sql
│   │   └── Final Structured Output
│   ├── Quality Check
│   ├── Approval
│   └── Publish
└── Outcome
```

Trace Metadata 至少包含 tenant_id、user_id、thread_id、task_id、agent/workflow/prompt/skill/tool 版本、model_alias、environment、business_domain。

---

## 19. Eval 架构

### 19.1 层次

```text
Model Eval
Tool Eval
Skill Eval
Agent Eval
Workflow Eval
Business Outcome Eval
```

### 19.2 Agent Eval 维度

Intent Accuracy、Tool/Skill Selection、Tool Arguments、Trajectory、Handoff、Task Completion、Safety、Cost、Latency。

### 19.3 数据集

Golden、Regression、Edge、Adversarial、Permission、Multi-tenant、Production Failure Replay。

### 19.4 CI Gate

```text
PR
  ↓
Unit Test
  ↓
Tool Contract Test
  ↓
Workflow Test
  ↓
Agent Eval
  ↓
Security Eval
  ↓
Threshold Gate
  ↓
Deploy
```

---

## 20. 可观测性架构

```text
Application Logs → Loki / Elasticsearch
Metrics          → Prometheus / Grafana
Distributed Trace→ OpenTelemetry
LLM Trace        → Langfuse
Audit            → Immutable Audit Store
```

关键指标：任务完成率、Agent/Tool 失败率、审批率、平均 Turns、Token、成本、P95 延迟、Timeout、No-progress、Guardrail Block、跨租户违规和用户反馈。

---

## 21. 多租户与权限

### RBAC

agent_user、tag_creator、tag_reviewer、tag_approver、data_steward、agent_admin、platform_admin。

### ABAC

tenant、department、domain、environment、region、data_sensitivity、operation、resource_owner。

### 过滤顺序

```text
Authentication
  ↓
Tenant Resolution
  ↓
Role / Attribute Resolution
  ↓
Agent Visibility
  ↓
Skill Visibility
  ↓
Tool Visibility
  ↓
Knowledge ACL
  ↓
Execution Policy
```

---

## 22. 安全基线

必须覆盖 SSO/OIDC、JWT、RBAC/ABAC、Tenant Isolation、Prompt/Tool/SQL/Command Injection、Secret Management、PII Redaction、Network Egress、Sandbox、Audit、Retention、Approval、Rate Limit、Cost Limit。

核心原则：

```text
LLM 只能调用系统暴露的能力
Tool 层必须再次校验权限
高风险操作必须人工审批
代码执行必须进入 Sandbox
密钥不能进入 Prompt
```

---

## 23. Sandbox 架构

```text
Agent
  ↓
Sandbox Manager
  ↓
Isolated Container / Pod
  ├── Workspace
  ├── CPU Limit
  ├── Memory Limit
  ├── Timeout
  ├── Network Policy
  └── Secret Scope
```

生命周期：Create → Mount Inputs → Execute → Collect Logs → Export Artifact → Destroy。

---

## 24. 数据库与基础设施

```text
PostgreSQL
  - Agent / Workflow / Skill / Prompt Registry
  - Business Registry
  - LangGraph Checkpoint

Redis
  - Cache / Rate Limit / Lock / Session Acceleration

Object Storage
  - Artifact / Large Tool Result / Knowledge Raw File / Dataset

Vector Store
  - pgvector / Qdrant

Search
  - OpenSearch / Elasticsearch

Langfuse
  - Trace / Eval / Prompt
```

---

## 25. 部署架构

```text
Kubernetes
├── API Gateway
├── Agent API
├── Agent Worker
├── LangGraph Runtime
├── Tool Gateway
├── MCP Servers
├── LLM Gateway
├── Sandbox Runner
├── Langfuse
├── PostgreSQL
├── Redis
├── Qdrant / OpenSearch
└── Object Storage
```

Agent API 负责请求、认证、SSE/WebSocket；Agent Worker 负责长任务、Graph Run 和 Tool 调用。

---

## 26. 高可用与弹性

- Agent API 无状态横向扩展。
- Worker 按任务队列扩展。
- Checkpoint 使用 PostgreSQL。
- Artifact 使用对象存储。
- Redis 高可用。
- Sandbox 使用短生命周期 Pod。
- Tool 设置熔断、超时和重试。
- LLM Gateway 支持 Fallback。

---

## 27. 推荐项目目录

```text
enterprise-agent-platform/
├── apps/
│   ├── agent-api/
│   ├── agent-worker/
│   ├── admin-api/
│   └── web-portal/
├── src/
│   ├── agents/
│   ├── graphs/
│   ├── tools/
│   ├── skills/
│   ├── prompts/
│   ├── middleware/
│   ├── guardrails/
│   ├── backends/
│   ├── memory/
│   ├── knowledge/
│   ├── registry/
│   ├── routing/
│   ├── approvals/
│   ├── observability/
│   ├── evals/
│   ├── security/
│   └── config/
├── mcp-servers/
│   ├── metadata-mcp/
│   ├── sql-mcp/
│   ├── tag-mcp/
│   └── quality-mcp/
├── skills/
├── evals/
├── infra/
│   ├── docker/
│   ├── helm/
│   ├── terraform/
│   └── monitoring/
├── tests/
├── docs/
├── pyproject.toml
└── docker-compose.yml
```

---

## 28. API 设计

```text
POST /v1/agents/{agent_id}/runs
GET  /v1/runs/{run_id}
GET  /v1/runs/{run_id}/stream
POST /v1/runs/{run_id}/resume
POST /v1/approvals/{approval_id}/approve
POST /v1/approvals/{approval_id}/reject
GET  /v1/artifacts/{artifact_id}
POST /v1/feedback
```

---

## 29. 版本与发布

版本对象：Agent、Workflow、Prompt、Skill、Tool、Model Policy、Knowledge Snapshot、Eval Dataset。

```text
Development
  ↓
Unit / Integration Test
  ↓
Agent Eval
  ↓
Security Review
  ↓
Candidate
  ↓
Pilot
  ↓
Canary
  ↓
Stable
  ↓
Rollback
```

---

## 30. AgentOps

```text
Agent Registry
WorkflowOps
SkillOps
PromptOps
ToolOps
MemoryOps
KnowledgeOps
EvalOps
ModelOps
CostOps
SecurityOps
```

运营看板应包括使用量、成功率、成本、延迟、用户反馈、Tool 错误、Skill 命中率、Model Fallback、审批等待时间和 Eval 趋势。

---

## 31. MVP 范围

第一阶段建议：

```text
1 个核心 Agent
1 条 LangGraph Workflow
5～10 个 Tools
3～5 个 Skills
1 个 PostgreSQL Checkpointer
1 个 CompositeBackend
1 个 Human Approval
1 个 LLM Gateway
1 套 Langfuse Trace
1 套 Golden Dataset
```

暂不建设大型 Agent Marketplace、复杂动态多 Agent 网络、自动修改生产 Skill 和自动发布高风险业务资产。

---

## 32. 实施路线

### 阶段一：基础运行

FastAPI、LangChain Model、Deep Agent、基础 Tool、LangGraph、Langfuse Trace。

### 阶段二：持久化与审批

PostgreSQL Checkpointer、CompositeBackend、Memory、Human-in-the-loop、Artifact Store。

### 阶段三：Registry 化

Agent、Workflow、Skill、Tool、Prompt Registry。

### 阶段四：企业治理

SSO、RBAC/ABAC、Tenant Isolation、Audit、Guardrail、Sandbox、Cost Policy。

### 阶段五：持续优化

Eval Dataset、Regression、Online Eval、A/B Test、Routing Optimization、Skill Retrieval、Model Optimization。

---

## 33. 最终职责边界

| 组件 | 核心职责 |
|---|---|
| Deep Agents | 复杂任务 Agent Harness |
| LangChain | 模型、Tool、Retriever、Middleware 抽象 |
| LangGraph | Workflow、State、Checkpoint、Interrupt |
| Langfuse | Trace、Prompt、Eval、成本和监控 |
| LLM Gateway | 模型抽象、路由、切换和容错 |
| MCP / Tools | 企业系统连接和真实操作 |
| Backend | Skill、Memory、文件和 Artifact 存储 |
| Checkpointer | Graph 执行状态与恢复 |
| Registry | Agent、Workflow、Skill、Prompt 和 Tool 治理 |
| Business Registry | 正式业务资产 |
| Sandbox | 隔离代码和 Shell 执行 |

---

## 34. 最终推荐模式

```text
企业入口
  ↓
API Gateway + FastAPI
  ↓
Agent Router
  ↓
LangGraph 主业务流程
  ↓
复杂节点调用 Deep Agent
  ↓
Deep Agent 使用 LangChain Model、Tool、Skill、Memory
  ↓
LLM Gateway 与 MCP / 企业系统
  ↓
Backend、Checkpointer 与 Business Registry 持久化
  ↓
Langfuse、OpenTelemetry、Prometheus 全链路观测
  ↓
Eval、反馈和版本治理持续优化
```

最重要的架构决策：

> LangGraph 控制正式业务流程，Deep Agents 处理复杂智能任务，LangChain 提供模型和工具抽象，Langfuse 负责全链路观测与评估。

这套分层能够同时满足 Agent 的灵活性，以及企业系统对安全、权限、审计、恢复、稳定性与治理的要求。
