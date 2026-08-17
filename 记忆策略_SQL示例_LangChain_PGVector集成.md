# 记忆详细读写策略 + SQL 查询示例 + LangChain PGVector 集成代码骨架

**版本**：v1.0  
**日期**：2026-08-15  
**配套文档**：Agent与Workflow设计_pgvector存储.md  
**目标**：给出可直接落地的记忆读写策略、常用 SQL，以及 LangChain + pgvector 的集成代码骨架。

---

## 1. 记忆（Memory）详细读写策略

### 1.1 记忆分类

| 记忆类型          | 存储位置              | 生命周期     | 主要用途                           | 写入时机                     |
|-------------------|-----------------------|--------------|------------------------------------|------------------------------|
| 短期记忆          | Agent State（内存/Checkpointer） | 单次任务     | 当前需求上下文、中间结果、用户反馈 | 每个节点执行后更新           |
| 长期记忆 - 案例   | agent_memory 表       | 持久         | 相似需求成功/失败经验召回          | 任务成功或失败结束时         |
| 长期记忆 - 映射示例 | agent_memory 表     | 持久         | 推荐字段映射时参考                 | 映射被确认并生效后           |
| 长期记忆 - 规范/规则 | agent_memory 或独立规则表 | 持久     | 命名规范、业务规则约束             | 管理员维护或定期同步         |
| 标签/字段向量     | tag_embedding / schema_field_embedding | 持久 | 语义查重与字段发现                 | 标签/字段创建或描述变更时   |

### 1.2 短期记忆策略

- **存储**：完全依赖 LangGraph 的 State + Checkpointer（推荐 PostgresSaver）。
- **内容**：`TagAgentState` 中的所有字段。
- **读写**：
  - 读：每个节点直接从 state 中获取。
  - 写：节点返回值自动合并进 state。
- **清理**：任务结束后可选择归档关键字段到 `agent_execution_log`，然后清理 thread。

### 1.3 长期记忆写入策略（Write）

#### 写入原则
1. **只写入高质量数据**：仅在人工确认通过或最终生效后写入。
2. **去重**：写入前先做向量相似度检查，避免高度重复的记忆。
3. **带元数据**：必须写入 `memory_type`、`metadata`（含 req_id、tag_ids、置信度、结果等）。
4. **模型版本记录**：记录使用的 embedding 模型，方便后续重建。

#### 写入时机与内容

**A. 成功案例写入**
```text
时机：finalize 节点，且 stop_reason == "completed"
内容：
- memory_type = "case"
- content = 原始需求 + 最终标签列表 + 映射关系摘要
- metadata = {
    "req_id": "...",
    "tags": [...],
    "mappings": [...],
    "confidence": 0.93,
    "result": "success"
  }
```

**B. 失败/驳回案例写入（可选，用于避坑）**
```text
时机：用户取消或审批驳回
memory_type = "case_failure"
content = 需求 + 失败原因
```

**C. 优质映射示例写入**
```text
时机：映射被确认并成功绑定后
memory_type = "mapping_example"
content = 标签名称 + 字段完整路径 + 映射规则
```

**D. 标签/字段向量写入**
- 新建标签或字段时同步写入。
- 标签描述或字段描述发生变更时，必须重新计算并更新 embedding。

#### 写入前去重逻辑（伪代码）
```python
def should_write_memory(content: str, memory_type: str, threshold: float = 0.92) -> bool:
    emb = embed(content)
    similar = search_memory(emb, memory_type=memory_type, top_k=1)
    if similar and similar[0]["similarity"] >= threshold:
        return False  # 已有高度相似记忆，跳过
    return True
```

### 1.4 长期记忆读取策略（Read / Retrieval）

#### 召回时机
1. **Planner 阶段**：召回相似历史需求案例，辅助生成更好的计划。
2. **Query Tag Library 前/后**：辅助判断是否复用。
3. **Recommend Mapping 阶段**：召回相似标签的历史映射示例。
4. **Validate 阶段**：检查是否有历史冲突记录。

#### 召回策略
- 使用当前用户需求文本（或需求 + 已抽取标签）生成 query embedding。
- 按 `memory_type` 过滤。
- 取 Top-K（建议 3~5），并设置最低相似度阈值（如 0.75）。
- 结果放入 state 的 `retrieved_memories`，供后续节点和 Prompt 使用。

#### 召回后使用方式
- 将召回内容作为上下文注入 Prompt（注意控制长度）。
- 或作为规则约束（例如历史失败原因直接作为校验条件）。

### 1.5 记忆维护策略

- **定期清理**：对过期、低质量、长期未命中的记忆做软删除或归档。
- **反馈更新**：用户明确表示「这个推荐很好/很差」时，可调整对应记忆的权重或删除。
- **重建**：更换 Embedding 模型时，需要全量重新计算向量。

---

## 2. 具体 SQL 查询示例

### 2.1 标签语义查重（最常用）

```sql
-- 输入：query_embedding (vector), top_k, 最低相似度
SELECT 
    t.tag_id,
    t.tag_code,
    t.tag_name,
    t.tag_type,
    t.description,
    t.status,
    1 - (e.embedding <=> $1) AS similarity
FROM tag_embedding e
JOIN tag_definition t ON e.tag_id = t.tag_id
WHERE t.status = 'active'
  AND 1 - (e.embedding <=> $1) >= 0.75          -- 最低相似度阈值
ORDER BY e.embedding <=> $1                     -- 余弦距离，越小越相似
LIMIT $2;                                       -- top_k
```

### 2.2 字段语义发现

```sql
SELECT 
    f.field_id,
    f.db_name,
    f.table_name,
    f.field_name,
    f.field_type,
    f.description,
    f.is_sensitive,
    1 - (e.embedding <=> $1) AS similarity
FROM schema_field_embedding e
JOIN schema_field f ON e.field_id = f.field_id
WHERE f.status = 'active'
ORDER BY e.embedding <=> $1
LIMIT $2;
```

### 2.3 历史记忆召回（按类型）

```sql
SELECT 
    memory_id,
    memory_type,
    content,
    metadata,
    1 - (embedding <=> $1) AS similarity,
    created_at
FROM agent_memory
WHERE memory_type = $2                          -- 'case' / 'mapping_example' 等
  AND 1 - (embedding <=> $1) >= 0.75
ORDER BY embedding <=> $1
LIMIT $3;
```

### 2.4 写入标签向量

```sql
-- 先插入主数据，再插入向量
INSERT INTO tag_definition (tag_code, tag_name, tag_type, description, status, source_req_id, created_by)
VALUES ($1, $2, $3, $4, 'active', $5, $6)
RETURNING tag_id;

INSERT INTO tag_embedding (tag_id, embedding, model_name)
VALUES ($1, $2, 'text-embedding-3-small');
```

### 2.5 写入长期记忆（带去重检查可在应用层做）

```sql
INSERT INTO agent_memory (memory_type, content, metadata, embedding, model_name)
VALUES ($1, $2, $3, $4, 'text-embedding-3-small')
RETURNING memory_id;
```

### 2.6 更新已有标签的 embedding（描述变更时）

```sql
UPDATE tag_embedding
SET embedding = $2,
    model_name = $3,
    updated_at = NOW()
WHERE tag_id = $1;
```

### 2.7 混合查询示例（标签 + 类型过滤）

```sql
SELECT t.*, 1 - (e.embedding <=> $1) AS similarity
FROM tag_embedding e
JOIN tag_definition t ON e.tag_id = t.tag_id
WHERE t.status = 'active'
  AND t.tag_type = $2                   -- 可选：按类型过滤
ORDER BY e.embedding <=> $1
LIMIT 10;
```

---

## 3. LangChain + PGVector 集成代码骨架

以下代码基于 `langchain_postgres`（推荐）或 `langchain_community`，可直接作为项目骨架使用。

### 3.1 依赖

```bash
pip install langchain langchain-openai langchain-postgres psycopg[binary] pgvector
# 或
pip install langchain-community
```

### 3.2 数据库连接与向量存储初始化

```python
import os
from langchain_openai import OpenAIEmbeddings
from langchain_postgres.vectorstores import PGVector
from langchain_core.documents import Document
from sqlalchemy import create_engine

# 连接字符串
CONNECTION_STRING = os.getenv(
    "DATABASE_URL", 
    "postgresql+psycopg://user:password@localhost:5432/tag_agent"
)

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")  # 或其他模型

# 标签向量存储
tag_vectorstore = PGVector(
    embeddings=embeddings,
    collection_name="tag_embeddings",
    connection=CONNECTION_STRING,
    use_jsonb=True,
)

# 字段向量存储
field_vectorstore = PGVector(
    embeddings=embeddings,
    collection_name="schema_field_embeddings",
    connection=CONNECTION_STRING,
    use_jsonb=True,
)

# 长期记忆向量存储
memory_vectorstore = PGVector(
    embeddings=embeddings,
    collection_name="agent_memory",
    connection=CONNECTION_STRING,
    use_jsonb=True,
)
```

> 注意：`langchain_postgres.PGVector` 默认会创建自己的 collection 表。  
> 如果想完全使用我们自定义的表结构（tag_embedding 等），建议自己封装检索逻辑（见 3.4），或使用原生 SQL + embedding。

### 3.3 使用自定义表的推荐方式（更灵活）

```python
from langchain_core.embeddings import Embeddings
from sqlalchemy import text
from sqlalchemy.orm import Session
import numpy as np

class PgvectorTagStore:
    def __init__(self, engine, embeddings: Embeddings, model_name: str = "text-embedding-3-small"):
        self.engine = engine
        self.embeddings = embeddings
        self.model_name = model_name

    def add_tag(self, tag_id: int, text: str):
        emb = self.embeddings.embed_query(text)
        with self.engine.begin() as conn:
            conn.execute(
                text("""
                    INSERT INTO tag_embedding (tag_id, embedding, model_name)
                    VALUES (:tag_id, :emb, :model)
                    ON CONFLICT (tag_id) DO UPDATE 
                    SET embedding = EXCLUDED.embedding, updated_at = NOW()
                """),
                {"tag_id": tag_id, "emb": emb, "model": self.model_name}
            )

    def similarity_search(self, query: str, top_k: int = 5, score_threshold: float = 0.75):
        emb = self.embeddings.embed_query(query)
        with self.engine.connect() as conn:
            result = conn.execute(
                text("""
                    SELECT t.tag_id, t.tag_name, t.tag_type, t.description,
                           1 - (e.embedding <=> :emb) AS similarity
                    FROM tag_embedding e
                    JOIN tag_definition t ON e.tag_id = t.tag_id
                    WHERE t.status = 'active'
                      AND 1 - (e.embedding <=> :emb) >= :threshold
                    ORDER BY e.embedding <=> :emb
                    LIMIT :top_k
                """),
                {"emb": emb, "threshold": score_threshold, "top_k": top_k}
            )
            return [dict(row._mapping) for row in result]


class PgvectorMemoryStore:
    def __init__(self, engine, embeddings: Embeddings, model_name: str = "text-embedding-3-small"):
        self.engine = engine
        self.embeddings = embeddings
        self.model_name = model_name

    def add_memory(self, memory_type: str, content: str, metadata: dict = None):
        emb = self.embeddings.embed_query(content)
        with self.engine.begin() as conn:
            conn.execute(
                text("""
                    INSERT INTO agent_memory (memory_type, content, metadata, embedding, model_name)
                    VALUES (:type, :content, :metadata, :emb, :model)
                """),
                {
                    "type": memory_type,
                    "content": content,
                    "metadata": metadata or {},
                    "emb": emb,
                    "model": self.model_name
                }
            )

    def search(self, query: str, memory_type: str = None, top_k: int = 5, score_threshold: float = 0.75):
        emb = self.embeddings.embed_query(query)
        sql = """
            SELECT memory_id, memory_type, content, metadata,
                   1 - (embedding <=> :emb) AS similarity
            FROM agent_memory
            WHERE 1 - (embedding <=> :emb) >= :threshold
        """
        params = {"emb": emb, "threshold": score_threshold, "top_k": top_k}
        
        if memory_type:
            sql += " AND memory_type = :type"
            params["type"] = memory_type
            
        sql += " ORDER BY embedding <=> :emb LIMIT :top_k"
        
        with self.engine.connect() as conn:
            result = conn.execute(text(sql), params)
            return [dict(row._mapping) for row in result]
```

### 3.4 在 Agent 工具中使用

```python
from langchain_core.tools import tool

# 初始化
engine = create_engine(CONNECTION_STRING)
tag_store = PgvectorTagStore(engine, embeddings)
memory_store = PgvectorMemoryStore(engine, embeddings)

@tool
def query_tag_library(tags: list[dict]) -> dict:
    """语义查询标签库，判断标签是否已存在"""
    existing = []
    need_create = []
    
    for tag in tags:
        query_text = f"{tag['name']} {tag.get('description', '')}"
        matches = tag_store.similarity_search(query_text, top_k=3, score_threshold=0.82)
        
        if matches and matches[0]["similarity"] >= 0.88:
            existing.append({"candidate": tag, "matched": matches[0]})
        else:
            need_create.append(tag)
            
    return {"existing": existing, "need_create": need_create}


@tool
def retrieve_similar_cases(requirement: str) -> dict:
    """召回相似历史成功案例"""
    cases = memory_store.search(
        query=requirement,
        memory_type="case",
        top_k=3,
        score_threshold=0.78
    )
    return {"retrieved_memories": cases}
```

### 3.5 任务成功后写入记忆示例

```python
def finalize_node(state: TagAgentState):
    if state.get("execution_result") and state.get("stop_reason") == "completed":
        content = f"""
        需求：{state['user_requirement']}
        最终标签：{state.get('final_tags')}
        映射关系：{state.get('confirmed_mappings')}
        """
        metadata = {
            "req_id": state.get("req_id"),
            "confidence": state.get("confidence"),
            "result": "success"
        }
        
        # 去重检查可在 add_memory 内部或外部做
        memory_store.add_memory(
            memory_type="case",
            content=content.strip(),
            metadata=metadata
        )
    
    # 生成报告...
    return {"messages": [...]}
```

---

## 4. 推荐实践总结

1. **短期记忆** → LangGraph State + Postgres Checkpointer  
2. **长期记忆与语义检索** → 自定义表 + pgvector + 自己封装的 Store 类（更可控）  
3. **写入要克制**：只在确认/成功后写入，并做相似度去重  
4. **读取要精准**：按 memory_type 过滤 + 相似度阈值 + Top-K 限制  
5. **模型变更时**：需要全量重建向量  
6. **监控**：记录每次召回的命中率与最终是否被采用，用于优化阈值

---

**文档结束**

此文档可直接指导开发实现记忆模块与向量检索相关功能。
