# VSCode Copilot Looping（Vibe Coding）完整落地指南

## 一、什么是 Looping（本质定义）

Looping ≠ 让 AI 一直生成代码

Looping = 一个可重复执行的工程闭环：

```
目标定义 → 实现 → 验证 → 修复 → 再验证 → 满足条件才结束
```

核心思想：

* 不允许 AI “写完就结束”
* 必须经过验证（test / lint / build）
* 失败必须自动修复
* 直到满足 exit criteria

---

## 二、Looping 的三种实现模型（Vibe Coding）

### 1️⃣ Ralph Loop（强制循环）

核心：

* 不允许 AI 退出
* 利用 hook / prompt 强制继续

机制：

* Stop Hook
* “继续执行下一任务”
* 任务队列驱动

适用于：

* Claude Code / 自动化 agent

---

### 2️⃣ Vibe Flow（推荐）

核心闭环：

```
写代码 → 运行测试 → 报错 → 修复 → 再运行
```

关键：

* AI必须执行验证
* AI必须理解错误
* AI必须继续修复

---

### 3️⃣ Agent Loop（工程级）

核心：

```
Planner → Implementation → Reviewer → 回环
```

特点：

* 多 agent 分工
* 可控循环
* 可用于企业级开发

---

## 三、VSCode Copilot 实现 Looping 的核心能力

Copilot 原生能力：

* Agent mode（多步骤执行）
* Custom Instructions（常驻规则）
* Prompt Files（可复用 prompt）
* Custom Agents（多角色）
* Background Agents（长任务执行）

---

## 四、最小可用 Looping 方案（必须实现）

### 1️⃣ 全局规则文件

路径：

```
.github/copilot-instructions.md
```

内容：

```md
---
applyTo: "**"
---

# Looping Workflow

## Process
1. Understand requirement
2. Implement minimal change
3. Run:
   - npm run lint
   - npm run test
   - npm run build
4. If fail → fix
5. Repeat

## Exit Criteria
- build passes
- tests pass
- lint passes
- requirement satisfied

## Constraints
- minimal diff
- no unnecessary changes
- keep code clean
```

---

### 2️⃣ 标准验证命令

package.json：

```json
{
  "scripts": {
    "lint": "eslint .",
    "test": "vitest run",
    "build": "vite build",
    "check": "npm run lint && npm run test && npm run build"
  }
}
```

---

### 3️⃣ Loop Prompt（核心）

```text
Use agent mode.

Work in looping mode:
- implement
- run npm run check
- fix errors
- repeat until all pass

Stop only when:
- all checks pass
- feature works
```

---

## 五、进阶方案（工程级）

### 1️⃣ 分层 Instructions

```
.github/instructions/
  ├── frontend.instructions.md
  ├── backend.instructions.md
  ├── testing.instructions.md
```

示例：

```md
---
applyTo: "**/*.tsx"
---

# React Rules
- use hooks
- no large components
- update tests if needed
```

---

### 2️⃣ Prompt Files（复用 Loop）

```
.github/prompts/loop-implement.prompt.md
```

```md
Implement task in loop mode:

1. analyze
2. implement
3. run validation
4. fix errors
5. repeat

Return:
- changed files
- errors fixed
- final status
```

---

### 3️⃣ 多 Agent Loop（推荐）

#### planner.agent.md

```md
---
name: planner
handoffs:
  - agent: implementation
---

- define plan
- define acceptance criteria
```

---

#### implementation.agent.md

```md
---
name: implementation
handoffs:
  - agent: reviewer
---

- implement code
- run npm run check
- fix errors
- repeat until pass
```

---

#### reviewer.agent.md

```md
---
name: reviewer
handoffs:
  - agent: implementation
---

- check correctness
- check scope
- if not ok → send back
```

---

## 六、任务队列 Loop（最稳定）

```
.ai/tasks/queue.md
```

```md
- [ ] login bug fix
- [ ] add pagination
- [ ] add unit tests
```

规则：

* 每次只做一个任务
* 完成必须验证
* 成功才打勾
* 循环直到为空

---

## 七、完整 Loop 架构（推荐）

```
User Task
   ↓
Planner
   ↓
Implementation (loop)
   ↓
Reviewer
   ↓
(if fail → Implementation)
   ↓
Done
```

---

## 八、关键设计原则（非常重要）

### 1️⃣ 没有验证 = 没有 Loop

必须有：

* test
* lint
* build

---

### 2️⃣ 必须有 Exit Criteria

否则会：

* 无限修改
* 假完成

---

### 3️⃣ 必须限制范围

否则会：

* 改动过大
* 破坏系统

---

### 4️⃣ Loop 要有反馈信号

核心信号：

```
test result
build result
error log
```

---

## 九、常见错误（踩坑）

### ❌ 只写 prompt，不写规则

→ 不会 loop

### ❌ 没有 test

→ AI 无法判断正确性

### ❌ 没有 exit 条件

→ 无限循环

### ❌ scope 不受控

→ 改坏系统

---

## 十、你这个场景的最佳实践（结合你背景）

建议你直接做：

### Level 1

* copilot-instructions
* npm run check

### Level 2

* instructions 分层
* prompt files

### Level 3

* multi-agent loop
* queue system

### Level 4（你适合）

* Agent Data Platform
* Harness Engineering
* 自动 loop pipeline

---

## 十一、总结一句话

Looping 的本质不是 Prompt，而是：

```
工程化闭环 + 可执行验证 + 可回滚修复
```

---

## 十二、可扩展方向（你可以继续做）

* Agent 自动 PRD → Dev → Test loop
* API contract → 自动前后端修改 loop
* SQL → 自动优化 loop
* Data pipeline → 自动修复 loop
* CI/CD → AI 自动修复失败 pipeline

---

# END

---
applyTo: "**"
---

# Looping workflow rules

## Goal
You are working in iterative delivery mode.
Never stop after only editing code.
Always validate the result before claiming completion.

## Required loop
For every requested feature or bugfix, follow this sequence:
1. Understand the target and restate the acceptance criteria.
2. Inspect related files and dependencies.
3. Implement the smallest working change.
4. Run lint.
5. Run unit tests.
6. Run build.
7. If any command fails, analyze the failure and fix it.
8. Repeat steps 4-7 until all required checks pass.
9. Summarize changed files, risks, and remaining gaps.

## Exit criteria
Stop only when ALL are true:
- build passes
- lint passes
- relevant tests pass
- acceptance criteria are met
- no obvious TODO left in changed code

## Safety constraints
- Do not rewrite unrelated modules
- Keep file size under 1000 lines
- Keep method size under 200 lines
- Prefer minimal diff
- If requirement is ambiguous, make the smallest reversible choice and document it


# Implement in looping mode

Task: ${input:task}

Work in iterative delivery mode.

Process:
1. Analyze the task and identify acceptance criteria.
2. Inspect related files.
3. Implement the smallest useful change.
4. Run project validation commands:
   - npm run lint
   - npm run test
   - npm run build
5. If any command fails:
   - read the output carefully
   - fix the root cause
   - rerun the failed command
6. Repeat until all checks pass.
7. Return:
   - changed files
   - commands run
   - failures encountered
   - final status
   - remaining risks

Do not stop after code generation only.
