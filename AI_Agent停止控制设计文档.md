# AI Agent 停止控制设计文档

**版本**：v1.0  
**日期**：2026-08-15  
**适用范围**：自动打标签系统单 Agent 模式（基于 LangGraph）  
**文档目的**：明确 Agent 在什么情况下停止、如何停止、如何安全兜底，作为开发与评审的依据。

---

## 1. 设计目标

在 AI Agent 执行过程中，必须具备清晰、可控、可预期的停止机制，避免以下问题：

- 无限循环或过度执行
- 在高风险操作（创建标签、绑定字段）前未暂停
- 用户无法主动终止
- 异常情况下失控
- 资源浪费（Token、计算资源）

**核心原则**：
1. 正常完成时优雅停止
2. 高风险节点强制暂停（Human-in-the-loop）
3. 异常与超限时强制兜底停止
4. 所有停止行为可记录、可追溯

---

## 2. 停止方式分类与优先级

Agent 停止决策按以下**优先级**从高到低判断：

| 优先级 | 停止类型               | 触发条件                                   | 行为                     | 是否可恢复 |
|--------|------------------------|--------------------------------------------|--------------------------|------------|
| 1      | 用户主动终止           | 用户输入「取消」「停止」「终止」等         | 立即结束                 | 否         |
| 2      | 安全兜底（硬限制）     | 超过最大步数 / 超时 / 不可恢复异常         | 强制结束并告警           | 否         |
| 3      | Human-in-the-loop 暂停 | 需要人工确认（新建标签、低置信度、冲突等） | 暂停等待用户指令         | 是         |
| 4      | 任务自然完成           | 已产生最终执行结果                         | 正常走向 END             | 否         |
| 5      | 业务规则停止           | 置信度低于阈值、存在严重冲突等             | 暂停转人工或结束         | 视情况     |

---

## 3. 具体停止机制设计

### 3.1 任务自然完成（正常停止）

**触发条件**：
- 状态中已存在 `execution_result`（标签创建与字段绑定已完成）
- 或 Reflect 节点判断目标已达成

**实现方式**：
```python
def should_continue(state: TagAgentState) -> Literal["continue", "end"]:
    if state.get("execution_result"):
        return "end"
    if state.get("human_feedback") in ["取消", "停止", "终止"]:
        return "end"
    if state.get("retry_count", 0) >= 3:
        return "end"
    return "continue"
```

**结果**：走向 `finalize` 节点，生成最终报告后结束。

---

### 3.2 Human-in-the-loop 强制暂停（最重要）

**必须暂停的场景**：
- 存在需要新建的标签
- 整体置信度 < 0.85
- 检测到标签冲突或命名不规范
- 字段映射存在高风险（敏感字段、数据质量差）
- 任何写操作（create_tag、bind_tag_to_field）执行前

**实现方式（LangGraph interrupt）**：
```python
from langgraph.types import interrupt

def human_confirm_node(state: TagAgentState):
    confirm_msg = format_confirm_message(state)
    
    # 真正暂停 Agent，等待外部输入
    human_response = interrupt({
        "type": "confirmation",
        "message": confirm_msg,
        "options": ["确认", "修改", "取消"]
    })
    
    return {
        "human_feedback": human_response,
        "need_human_confirm": False
    }
```

**行为说明**：
- Agent 执行到此节点时**完全停止**
- 前端展示确认信息，等待用户操作
- 用户选择「确认」→ 继续执行
- 用户选择「修改」→ 携带修改意见重新规划
- 用户选择「取消」→ 终止整个流程

---

### 3.3 最大步数 / 递归限制（安全兜底）

**目的**：防止死循环或异常导致的无限执行。

**推荐配置**：
```python
# 编译时
app = workflow.compile(checkpointer=memory)

# 调用时
config = {
    "recursion_limit": 25,          # 建议值：20~30
    "configurable": {
        "thread_id": requirement_id
    }
}
```

**节点内额外计数保护**：
```python
def any_business_node(state: TagAgentState):
    step_count = state.get("step_count", 0) + 1
    if step_count > 20:
        return {
            "error": "超过最大执行步数，强制停止",
            "stop_reason": "max_steps_exceeded"
        }
    return {"step_count": step_count}
```

---

### 3.4 超时控制

**建议**：
- 整个 Agent 运行设置总超时（例如 5~10 分钟）
- 单个工具调用设置超时（例如 30 秒）

超时时记录 `stop_reason = "timeout"` 并结束。

---

### 3.5 用户主动终止

**实现方式**：
1. 前端提供「停止 Agent」按钮
2. 后端接收到停止信号后，更新对应 thread 的状态为终止
3. 或在下一次节点执行前检查 `human_feedback` 是否为终止指令

**关键词识别**（可选）：
- 「取消」「停止」「终止」「不用了」「算了」等

---

### 3.6 异常与错误停止

**捕获场景**：
- 工具调用失败（标签库不可用、元数据服务异常等）
- LLM 返回无法解析的结果
- 权限不足
- 数据校验严重失败

**处理原则**：
- 记录详细错误信息与 `stop_reason`
- 不自动重试超过限制次数的错误
- 通知相关人员

---

## 4. 停止原因（stop_reason）标准化

建议在状态中增加 `stop_reason` 字段，统一记录停止原因，便于监控与审计：

| stop_reason 值              | 含义                         |
|-----------------------------|------------------------------|
| `completed`                 | 正常完成                     |
| `user_cancelled`            | 用户主动取消                 |
| `max_steps_exceeded`        | 超过最大步数                 |
| `timeout`                   | 执行超时                     |
| `low_confidence`            | 置信度过低转人工后终止       |
| `conflict_detected`         | 检测到冲突                   |
| `human_rejected`            | 人工确认时选择取消/驳回      |
| `tool_error`                | 工具调用失败                 |
| `permission_denied`         | 权限不足                     |
| `unknown_error`             | 未知异常                     |

---

## 5. 状态字段补充建议

在原有 `TagAgentState` 中增加以下字段以支持停止控制：

```python
class TagAgentState(TypedDict):
    # ... 原有字段 ...
    
    step_count: int                     # 当前已执行步数
    retry_count: int                    # 重试次数
    stop_reason: Optional[str]          # 停止原因
    need_human_confirm: bool            # 是否需要人工确认
    human_feedback: Optional[str]       # 人工反馈内容
    error: Optional[str]                # 错误信息
```

---

## 6. 监控与可观测性要求

1. 每次 Agent 结束都必须记录 `stop_reason`
2. 统计各类停止原因的分布（用于优化）
3. 对 `max_steps_exceeded`、`timeout`、`tool_error` 设置告警
4. 人工确认节点的等待时长需可观测（避免任务长期挂起）

---

## 7. 与标签业务场景的结合要求

| 业务场景                     | 停止策略要求                                   |
|------------------------------|------------------------------------------------|
| 仅查询、推荐映射（无写操作） | 高置信度可直接完成；低置信度暂停确认           |
| 需要新建标签                 | **必须**在创建前暂停，等待人工确认             |
| 字段绑定（写操作）           | **必须**在执行前暂停，等待人工确认             |
| 检测到命名冲突或规范问题     | 暂停并提示冲突，不允许自动跳过                 |
| 用户中途取消                 | 立即停止，不执行任何写操作                     |
| 系统异常                     | 停止并回滚未提交的变更（如有）                 |

---

## 8. 实现检查清单（开发自检）

- [ ] 条件边正确路由到 `END`
- [ ] `human_confirm` 节点使用 `interrupt` 实现真正暂停
- [ ] 设置了合理的 `recursion_limit`
- [ ] 节点内有步数保护
- [ ] 支持用户主动取消
- [ ] 所有停止路径都写入 `stop_reason`
- [ ] 写操作前必须经过确认节点
- [ ] 异常被捕获并优雅停止
- [ ] 停止后状态可被正确归档

---

## 9. 总结

Agent 停止控制不是可选项，而是生产级 Agent 的**必备安全机制**。

本系统采用「**业务完成自然停 + 高风险强制暂停 + 硬限制兜底**」的三层策略：

1. **正常路径**：任务完成 → 优雅结束
2. **关键路径**：写操作与低置信度 → 必须人工确认后才继续
3. **异常路径**：步数超限、超时、错误 → 强制停止并记录原因

通过以上设计，可确保 Agent 在可控、可预期、可审计的范围内运行。

---

**文档结束**
