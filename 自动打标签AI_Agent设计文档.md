# 自动打标签系统 AI Agent 设计文档（单 Agent 模式）

**版本**：v1.0  
**日期**：2026-08-15  
**模式**：单 Agent（Plan-and-Execute + ReAct）  
**框架推荐**：LangGraph  
**适用场景**：用户输入业务需求 → 自动拆解标签 → 查询/新建标签 → 发现表字段 → 推荐映射 → 人工确认 → 执行落地

---

## 1. 整体架构概述

采用 **单 Agent + 状态机** 模式，核心循环为：

```
用户需求 → 规划（Plan）→ 执行工具（Act）→ 观察结果（Observe）→ 反思（Reflect）→ 决策（继续 / 确认 / 结束）
```

关键设计原则：
- **高置信度自动执行**，低置信度或关键写操作强制人工确认（Human-in-the-loop）
- 所有写操作（创建标签、绑定字段）必须经过确认节点
- 完整记录 Thought / Action / Observation，便于审计与调试
- 状态持久化，支持中断恢复

---

## 2. 状态机设计（LangGraph）

### 2.1 状态定义（State）

```python
from typing import TypedDict, List, Dict, Optional, Annotated
from langgraph.graph.message import add_messages
import operator

class TagAgentState(TypedDict):
    # 对话与消息
    messages: Annotated[List, add_messages]
    
    # 用户原始需求
    user_requirement: str
    
    # 规划相关
    plan: List[str]                    # 执行计划步骤
    current_step: int                  # 当前执行到第几步
    
    # 标签相关
    extracted_tags: List[Dict]         # 抽取的候选标签
    existing_tags: List[Dict]          # 标签库中已存在的匹配结果
    new_tags: List[Dict]               # 需要新建的标签
    final_tags: List[Dict]             # 最终确认的标签列表
    
    # 字段与映射
    discovered_schemas: List[Dict]     # 发现的表与字段
    recommended_mappings: List[Dict]   # 推荐的标签-字段映射
    confirmed_mappings: List[Dict]     # 用户确认后的映射
    
    # 执行控制
    confidence: float                  # 整体置信度
    need_human_confirm: bool           # 是否需要人工确认
    human_feedback: Optional[str]      # 人工反馈内容
    execution_result: Optional[Dict]   # 最终执行结果
    
    # 错误与重试
    error: Optional[str]
    retry_count: int
```

### 2.2 节点（Nodes）定义

| 节点名称              | 职责说明                                                                 |
|-----------------------|--------------------------------------------------------------------------|
| `planner`             | 根据用户需求生成/更新执行计划                                            |
| `extract_tags`        | 调用标签抽取工具，从需求中拆解结构化标签                                 |
| `query_tag_library`   | 查询现有标签库，判断标签是否已存在                                       |
| `discover_schema`     | 发现相关数据表与字段                                                     |
| `recommend_mapping`   | 推荐标签与字段的映射关系（含置信度）                                     |
| `validate`            | 校验标签命名规范、冲突、业务规则                                         |
| `human_confirm`       | 向用户展示结果并请求确认（关键节点）                                     |
| `execute`             | 执行创建标签 + 绑定字段                                                   |
| `reflect`             | 反思当前结果，决定下一步（继续、重规划、结束）                           |
| `finalize`            | 生成最终报告并结束                                                       |

### 2.3 边（Edges）与条件路由

```python
# 伪代码示意
workflow = StateGraph(TagAgentState)

# 添加节点
workflow.add_node("planner", planner_node)
workflow.add_node("extract_tags", extract_tags_node)
workflow.add_node("query_tag_library", query_tag_library_node)
workflow.add_node("discover_schema", discover_schema_node)
workflow.add_node("recommend_mapping", recommend_mapping_node)
workflow.add_node("validate", validate_node)
workflow.add_node("human_confirm", human_confirm_node)
workflow.add_node("execute", execute_node)
workflow.add_node("reflect", reflect_node)
workflow.add_node("finalize", finalize_node)

# 入口
workflow.set_entry_point("planner")

# 固定流转（简化版）
workflow.add_edge("planner", "extract_tags")
workflow.add_edge("extract_tags", "query_tag_library")
workflow.add_edge("query_tag_library", "discover_schema")
workflow.add_edge("discover_schema", "recommend_mapping")
workflow.add_edge("recommend_mapping", "validate")

# 条件边：是否需要人工确认
workflow.add_conditional_edges(
    "validate",
    should_human_confirm,          # 函数：根据 confidence 和规则返回 "human_confirm" 或 "execute"
    {
        "human_confirm": "human_confirm",
        "execute": "execute"
    }
)

workflow.add_edge("human_confirm", "execute")   # 确认后执行（实际可再分支）
workflow.add_edge("execute", "reflect")
workflow.add_conditional_edges(
    "reflect",
    should_continue,               # 根据结果决定结束或重规划
    {
        "continue": "planner",
        "end": "finalize"
    }
)
workflow.add_edge("finalize", END)
```

### 2.4 完整 LangGraph 伪代码

```python
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from typing import Literal

# ==================== 工具定义（见第3章） ====================
tools = [extract_tags_tool, query_tag_library_tool, discover_schema_tool, 
         recommend_mapping_tool, validate_tag_tool, create_tag_tool, 
         bind_tag_to_field_tool]

tool_node = ToolNode(tools)

# ==================== 节点函数 ====================
def planner_node(state: TagAgentState):
    """生成或更新执行计划"""
    prompt = PLANNER_PROMPT.format(
        requirement=state["user_requirement"],
        current_plan=state.get("plan", []),
        extracted_tags=state.get("extracted_tags", [])
    )
    response = llm.invoke([SystemMessage(content=prompt)])
    # 解析 plan
    plan = parse_plan(response.content)
    return {
        "plan": plan,
        "current_step": 0,
        "messages": [AIMessage(content=f"已生成计划：{plan}")]
    }

def extract_tags_node(state: TagAgentState):
    """抽取标签"""
    result = extract_tags_tool.invoke({"requirement": state["user_requirement"]})
    return {
        "extracted_tags": result["tags"],
        "messages": [AIMessage(content=f"抽取到标签：{result['tags']}")]
    }

def query_tag_library_node(state: TagAgentState):
    result = query_tag_library_tool.invoke({"tags": state["extracted_tags"]})
    return {
        "existing_tags": result["existing"],
        "new_tags": result["need_create"],
        "messages": [AIMessage(content=f"已存在：{result['existing']}，需新建：{result['need_create']}")]
    }

def discover_schema_node(state: TagAgentState):
    result = discover_schema_tool.invoke({
        "tags": state["extracted_tags"],
        "requirement": state["user_requirement"]
    })
    return {
        "discovered_schemas": result["schemas"],
        "messages": [AIMessage(content=f"发现相关表字段：{result['schemas']}")]
    }

def recommend_mapping_node(state: TagAgentState):
    result = recommend_mapping_tool.invoke({
        "tags": state["extracted_tags"],
        "schemas": state["discovered_schemas"]
    })
    return {
        "recommended_mappings": result["mappings"],
        "confidence": result["avg_confidence"],
        "messages": [AIMessage(content=f"推荐映射：{result['mappings']}")]
    }

def validate_node(state: TagAgentState):
    result = validate_tag_tool.invoke({
        "tags": state["extracted_tags"] + state.get("new_tags", []),
        "mappings": state["recommended_mappings"]
    })
    need_confirm = result["has_conflict"] or state["confidence"] < 0.85
    return {
        "need_human_confirm": need_confirm,
        "messages": [AIMessage(content=f"校验结果：{result}")]
    }

def human_confirm_node(state: TagAgentState):
    """生成确认信息，等待用户输入（实际部署时通过 interrupt 或外部接口实现）"""
    confirm_msg = format_confirm_message(state)
    # 在真实系统中使用 langgraph 的 interrupt 或外部 API 等待用户反馈
    return {
        "messages": [AIMessage(content=confirm_msg)],
        "need_human_confirm": True
    }

def execute_node(state: TagAgentState):
    """执行创建与绑定（仅在确认后调用）"""
    create_result = create_tag_tool.invoke({"tags": state.get("new_tags", [])})
    bind_result = bind_tag_to_field_tool.invoke({"mappings": state["confirmed_mappings"] or state["recommended_mappings"]})
    return {
        "execution_result": {
            "created": create_result,
            "bound": bind_result
        },
        "messages": [AIMessage(content="标签创建与字段关联已完成")]
    }

def reflect_node(state: TagAgentState):
    """反思是否完成或需要重新规划"""
    if state.get("execution_result"):
        return {"messages": [AIMessage(content="任务完成")]}
    # 否则可能返回需要重规划的信号
    return {"messages": [AIMessage(content="需要进一步处理")]}

def finalize_node(state: TagAgentState):
    report = generate_final_report(state)
    return {
        "messages": [AIMessage(content=report)],
        "execution_result": state.get("execution_result")
    }

# ==================== 条件函数 ====================
def should_human_confirm(state: TagAgentState) -> Literal["human_confirm", "execute"]:
    if state.get("need_human_confirm", True):
        return "human_confirm"
    return "execute"

def should_continue(state: TagAgentState) -> Literal["continue", "end"]:
    if state.get("execution_result"):
        return "end"
    return "continue"

# ==================== 构建图 ====================
def build_tag_agent():
    workflow = StateGraph(TagAgentState)
    
    workflow.add_node("planner", planner_node)
    workflow.add_node("extract_tags", extract_tags_node)
    workflow.add_node("query_tag_library", query_tag_library_node)
    workflow.add_node("discover_schema", discover_schema_node)
    workflow.add_node("recommend_mapping", recommend_mapping_node)
    workflow.add_node("validate", validate_node)
    workflow.add_node("human_confirm", human_confirm_node)
    workflow.add_node("execute", execute_node)
    workflow.add_node("reflect", reflect_node)
    workflow.add_node("finalize", finalize_node)
    
    workflow.set_entry_point("planner")
    
    workflow.add_edge("planner", "extract_tags")
    workflow.add_edge("extract_tags", "query_tag_library")
    workflow.add_edge("query_tag_library", "discover_schema")
    workflow.add_edge("discover_schema", "recommend_mapping")
    workflow.add_edge("recommend_mapping", "validate")
    
    workflow.add_conditional_edges(
        "validate",
        should_human_confirm,
        {"human_confirm": "human_confirm", "execute": "execute"}
    )
    
    workflow.add_edge("human_confirm", "execute")
    workflow.add_edge("execute", "reflect")
    
    workflow.add_conditional_edges(
        "reflect",
        should_continue,
        {"continue": "planner", "end": "finalize"}
    )
    
    workflow.add_edge("finalize", END)
    
    return workflow.compile()
```

---

## 3. 工具接口定义（JSON Schema）

所有工具遵循 OpenAI Function Calling / LangChain Tool 规范。

### 3.1 extract_tags

```json
{
  "name": "extract_tags",
  "description": "从用户业务需求中抽取结构化标签，包括地点、人群、产品、活动类型等",
  "parameters": {
    "type": "object",
    "properties": {
      "requirement": {
        "type": "string",
        "description": "用户原始需求文本"
      }
    },
    "required": ["requirement"]
  }
}
```

**返回示例**：
```json
{
  "tags": [
    {"name": "广州", "type": "location", "value": "广州"},
    {"name": "留学生", "type": "audience", "value": "留学生"},
    {"name": "信用卡", "type": "product", "value": "信用卡"},
    {"name": "推荐活动", "type": "activity", "value": "推荐活动"}
  ]
}
```

### 3.2 query_tag_library

```json
{
  "name": "query_tag_library",
  "description": "查询标签库，判断候选标签是否已存在，返回已存在标签和需要新建的标签",
  "parameters": {
    "type": "object",
    "properties": {
      "tags": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "name": {"type": "string"},
            "type": {"type": "string"}
          }
        }
      }
    },
    "required": ["tags"]
  }
}
```

### 3.3 discover_schema

```json
{
  "name": "discover_schema",
  "description": "根据标签和需求，发现相关的数据表与字段信息",
  "parameters": {
    "type": "object",
    "properties": {
      "tags": {"type": "array", "items": {"type": "object"}},
      "requirement": {"type": "string"}
    },
    "required": ["tags"]
  }
}
```

### 3.4 recommend_mapping

```json
{
  "name": "recommend_mapping",
  "description": "为标签推荐与表字段的映射关系，并给出置信度",
  "parameters": {
    "type": "object",
    "properties": {
      "tags": {"type": "array", "items": {"type": "object"}},
      "schemas": {"type": "array", "items": {"type": "object"}}
    },
    "required": ["tags", "schemas"]
  }
}
```

**返回示例**：
```json
{
  "mappings": [
    {
      "tag_name": "广州",
      "table": "user_profile",
      "field": "city",
      "confidence": 0.95,
      "reason": "字段语义高度匹配"
    },
    {
      "tag_name": "留学生",
      "table": "user_profile",
      "field": "is_international_student",
      "confidence": 0.92,
      "reason": "布尔字段直接对应人群属性"
    }
  ],
  "avg_confidence": 0.91
}
```

### 3.5 validate_tag

```json
{
  "name": "validate_tag",
  "description": "校验标签命名规范、是否冲突、是否符合业务规则",
  "parameters": {
    "type": "object",
    "properties": {
      "tags": {"type": "array"},
      "mappings": {"type": "array"}
    },
    "required": ["tags"]
  }
}
```

### 3.6 create_tag

```json
{
  "name": "create_tag",
  "description": "正式创建新标签（写操作，需确认后调用）",
  "parameters": {
    "type": "object",
    "properties": {
      "tags": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "name": {"type": "string"},
            "type": {"type": "string"},
            "description": {"type": "string"}
          }
        }
      }
    },
    "required": ["tags"]
  }
}
```

### 3.7 bind_tag_to_field

```json
{
  "name": "bind_tag_to_field",
  "description": "将标签与表字段进行绑定关联（写操作）",
  "parameters": {
    "type": "object",
    "properties": {
      "mappings": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "tag_name": {"type": "string"},
            "table": {"type": "string"},
            "field": {"type": "string"}
          }
        }
      }
    },
    "required": ["mappings"]
  }
}
```

---

## 4. 提示词模板（Prompt Templates）

### 4.1 系统提示词（System Prompt）

```text
你是一个专业的「自动打标签 Agent」，负责从业务需求中拆解标签、查询标签库、发现数据表字段、推荐映射，并最终完成标签创建与字段关联。

你的工作原则：
1. 严格遵循既定计划执行，每一步都要调用对应工具。
2. 高置信度（≥0.85）且无冲突时可建议自动执行，否则必须请求人工确认。
3. 所有写操作（创建标签、绑定字段）必须经过确认。
4. 思考过程清晰，输出时使用 Thought / Action / Observation 格式（如需要）。
5. 最终生成结构化、可审计的结果报告。

可用工具：extract_tags, query_tag_library, discover_schema, recommend_mapping, validate_tag, create_tag, bind_tag_to_field。
```

### 4.2 规划器提示词（Planner Prompt）

```text
根据用户需求，生成清晰的执行计划。

用户需求：{requirement}

当前已有信息：
- 已抽取标签：{extracted_tags}
- 当前计划：{current_plan}

请输出一个分步骤的计划列表，格式如下：
1. 抽取标签
2. 查询标签库
3. 发现相关表字段
4. 推荐映射关系
5. 校验与确认
6. 执行创建与绑定

只输出计划步骤，不要多余解释。
```

### 4.3 标签抽取提示词（Extract Tags Prompt）

```text
你是一个标签抽取专家。请从以下业务需求中抽取结构化标签。

需求：{requirement}

抽取规则：
- 地点（location）
- 人群（audience）
- 产品（product）
- 活动类型（activity）
- 其他关键属性

输出严格 JSON 格式：
{
  "tags": [
    {"name": "标签名", "type": "类型", "value": "值"}
  ]
}
```

### 4.4 映射推荐提示词（Recommend Mapping Prompt）

```text
根据以下标签和发现的表结构，推荐最合理的标签-字段映射关系，并给出置信度（0-1）和理由。

标签：{tags}
表结构：{schemas}

输出 JSON：
{
  "mappings": [
    {
      "tag_name": "...",
      "table": "...",
      "field": "...",
      "confidence": 0.95,
      "reason": "..."
    }
  ],
  "avg_confidence": 0.92
}
```

### 4.5 人工确认提示词（Human Confirm Message）

```text
【需要您确认】

根据您的需求「{requirement}」，我已完成以下分析：

一、候选标签
{extracted_tags_formatted}

二、标签库状态
- 已存在：{existing_tags}
- 建议新建：{new_tags}

三、推荐字段映射
{mappings_formatted}

四、整体置信度：{confidence}

请回复：
- 「确认」：按上述方案执行创建与绑定
- 「修改：xxx」：说明需要修改的内容
- 「取消」：终止本次流程
```

### 4.6 最终报告提示词（Finalize Prompt）

```text
根据整个执行过程，生成一份清晰的最终报告，包含：
1. 原始需求
2. 最终标签列表（新建 + 复用）
3. 标签与字段的最终映射关系
4. 执行结果（成功/失败详情）
5. 建议后续动作（如有）

使用结构化 Markdown 输出。
```

---

## 5. 单 Agent 执行流程图（简化）

```
用户输入需求
      │
      ▼
┌─────────────┐
│   Planner   │ ← 生成计划
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Extract Tags│
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ Query Tag Library│
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Discover Schema │
└──────┬──────────┘
       │
       ▼
┌──────────────────┐
│ Recommend Mapping│
└──────┬───────────┘
       │
       ▼
┌─────────────┐
│   Validate  │
└──────┬──────┘
       │
       ├── 置信度高且无冲突 ──► Execute
       │
       └── 需要确认 ──► Human Confirm ──► Execute
                              │
                              ▼
                         Reflect / Finalize
                              │
                              ▼
                         输出最终报告
```

---

## 6. 实现与部署建议

1. **框架**：LangGraph + LangChain（支持 interrupt 实现真正的 Human-in-the-loop）
2. **LLM**：建议使用支持稳定 Function Calling 的模型（GPT-4o、Claude 3.5、Qwen2.5、DeepSeek 等）
3. **状态持久化**：使用 LangGraph 的 Checkpointer（MemorySaver 或 PostgresSaver）
4. **安全**：
   - 写操作（create_tag、bind_tag_to_field）必须经过确认节点
   - 增加权限校验中间件
   - 完整日志记录
5. **扩展**：后续可把标签库与表结构做成知识图谱，接入 KAG 增强推荐准确率

---

## 7. 示例运行记录（参考）

**用户输入**：在广州举行信用卡推荐活动为留学生

**Agent 输出摘要**：
- 抽取标签：广州(location)、留学生(audience)、信用卡(product)、推荐活动(activity)
- 标签库：前三个已存在，推荐活动建议新建
- 映射推荐：
  - 广州 → user_profile.city (0.95)
  - 留学生 → user_profile.is_international_student (0.92)
  - 信用卡 → card_info.card_type (0.90)
  - 推荐活动 → activity.activity_type (新建)
- 置信度：0.91 → 触发人工确认
- 用户确认后执行成功

---

**文档结束**

如需进一步细化某个节点的实现代码、增加错误重试逻辑，或扩展为 Multi-Agent 模式，请随时告知。
