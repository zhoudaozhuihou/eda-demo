# Knowledge Skill Management Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Skill-first management center with a separate unified knowledge library, immutable Skill versions, candidate confirmation, retrieval, and traceable chat usage.

**Architecture:** Keep executable `BaseSkill` unchanged and add a separate knowledge-Skill domain. Backend services own lifecycle, versioning, matching, and audit rules; routers remain thin. Frontend exposes `/knowledge/skills` and `/knowledge/library`, sharing navigation, filters, and object drawers.

**Tech Stack:** FastAPI, SQLAlchemy async, SQLite schema upgrader, pytest, React, TypeScript, Material UI, React Router, Vitest.

---

## File map

- Create `backend/app/models/knowledge_skill.py`: Skill, version, candidate, publication, usage, and relationship tables.
- Create `backend/app/services/knowledge_skill_service.py`: lifecycle and immutable version rules.
- Create `backend/app/services/skill_candidate_service.py`: candidate scoring, validation, and confirmation.
- Create `backend/app/services/skill_retrieval_service.py`: permission filtering, scoring, conflict resolution, and prompt rendering.
- Create `backend/app/routers/knowledge_skills.py`: Skill, version, candidate, publication, metrics, and feedback APIs.
- Modify `backend/app/services/schema_upgrade.py`: idempotent table/index creation.
- Modify `backend/app/models/__init__.py`, `backend/app/main.py`: model and router registration.
- Modify `backend/app/routers/agent_chat.py`: session-aware orchestration and `used_skills`.
- Create `backend/tests/test_knowledge_skills.py`, `backend/tests/test_skill_retrieval.py`.
- Create `frontend/src/types/knowledgeSkill.ts`, `frontend/src/lib/api/knowledgeSkills.ts`.
- Create `frontend/src/components/knowledge/KnowledgeCenterNav.tsx`.
- Create `frontend/src/components/knowledge/SkillDetailDrawer.tsx`.
- Create `frontend/src/components/knowledge/KnowledgeDetailDrawer.tsx`.
- Create `frontend/src/pages/KnowledgeSkills.tsx`: Skill-first page.
- Refactor `frontend/src/pages/KnowledgeManagement.tsx`: unified knowledge library without tabs.
- Modify `frontend/src/App.tsx` and `frontend/src/components/layout/AppLayout.tsx`: routes and navigation.
- Create `frontend/src/pages/KnowledgeSkills.test.tsx`, `frontend/src/pages/KnowledgeManagement.test.tsx`.

### Task 1: Persist the knowledge-Skill domain

**Files:**
- Create: `backend/app/models/knowledge_skill.py`
- Modify: `backend/app/models/__init__.py`
- Modify: `backend/app/services/schema_upgrade.py`
- Test: `backend/tests/test_schema_upgrade.py`

- [ ] **Step 1: Write failing schema tests**

Assert that startup creates `knowledge_skills`, `skill_versions`, `skill_candidates`, `skill_publish_requests`, `skill_usages`, `skill_test_cases`, and `skill_test_runs`, plus a unique version tuple and content-hash index.

```python
@pytest.mark.asyncio
async def test_upgrade_creates_knowledge_skill_tables(db_engine):
    await upgrade_schema(db_engine)
    names = await table_names(db_engine)
    assert {"knowledge_skills", "skill_versions", "skill_candidates"} <= names
```

- [ ] **Step 2: Run the test and verify failure**

Run: `cd backend && pytest tests/test_schema_upgrade.py -q`
Expected: FAIL because the new tables do not exist.

- [ ] **Step 3: Add focused SQLAlchemy models**

Use string UUID keys and JSON stored as `Text`, matching existing SQLite conventions. Make `SkillVersion` immutable at the service boundary and add unique constraints:

```python
class SkillVersion(Base):
    __tablename__ = "skill_versions"
    __table_args__ = (
        UniqueConstraint("skill_id", "version_major", "version_minor", "version_patch"),
        UniqueConstraint("skill_id", "content_hash"),
    )
```

Include `KnowledgeSkill.current_version_id`, `published_version_id`, `scope`, `status`, soft-delete timestamp, and audit timestamps.

- [ ] **Step 4: Add idempotent schema upgrades and model exports**

Follow `schema_upgrade.py`’s existing inspector/DDL pattern. Running upgrade twice must succeed without changing data.

- [ ] **Step 5: Run tests**

Run: `cd backend && pytest tests/test_schema_upgrade.py -q`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/app/models/knowledge_skill.py backend/app/models/__init__.py backend/app/services/schema_upgrade.py backend/tests/test_schema_upgrade.py
git commit -m "feat: add knowledge skill persistence"
```

### Task 2: Implement immutable versions and lifecycle rules

**Files:**
- Create: `backend/app/services/knowledge_skill_service.py`
- Test: `backend/tests/test_knowledge_skills.py`

- [ ] **Step 1: Write failing service tests**

Cover initial `1.0.0`, identical-content rejection, minimum semantic bump, stale hash conflict, disable/enable, and rollback pointer behavior.

```python
async def test_rollback_keeps_newer_versions(session):
    service = KnowledgeSkillService(session)
    skill = await service.create(owner_id="u1", content=CONTENT)
    v2 = await service.create_version(skill.id, "u1", UPDATED, "minor", skill.current_hash)
    await service.rollback(skill.id, "u1", "1.0.0")
    assert await service.version_exists(v2.id)
    assert (await service.get(skill.id, "u1")).current_version == "1.0.0"
```

- [ ] **Step 2: Run tests and verify failure**

Run: `cd backend && pytest tests/test_knowledge_skills.py -q`
Expected: FAIL because the service does not exist.

- [ ] **Step 3: Implement canonicalization and hashing**

Canonicalize sorted JSON with compact separators, validate required fields, reject prompt-injection phrases, and compute SHA-256.

- [ ] **Step 4: Implement version creation**

Classify changed fields: trigger/description/example-only = patch; additive constraint/scenario = minor; instruction removal or incompatible output change = major. Reject a requested bump below the detected minimum and raise a typed `VersionConflict` for stale `If-Match`.

- [ ] **Step 5: Implement lifecycle and audit writes**

Every create, version, enable, disable, rollback, publish request, approval, rejection, suspension, and archive operation adds an `AuditLog`.

- [ ] **Step 6: Run tests and commit**

Run: `cd backend && pytest tests/test_knowledge_skills.py -q`
Expected: PASS.

```bash
git add backend/app/services/knowledge_skill_service.py backend/tests/test_knowledge_skills.py
git commit -m "feat: manage immutable skill versions"
```

### Task 3: Build candidate extraction and confirmation

**Files:**
- Create: `backend/app/services/skill_candidate_service.py`
- Test: `backend/tests/test_knowledge_skills.py`

- [ ] **Step 1: Add failing tests**

Test that greetings do not create candidates, explicit corrections score above `0.65`, sensitive values are redacted, and confirmation atomically creates Skill `1.0.0`.

- [ ] **Step 2: Run the focused tests**

Run: `cd backend && pytest tests/test_knowledge_skills.py -k candidate -q`
Expected: FAIL.

- [ ] **Step 3: Implement deterministic eligibility and scoring**

```python
score = (
    reusable * Decimal("0.30")
    + explicit_correction * Decimal("0.25")
    + recurrence * Decimal("0.20")
    + business_impact * Decimal("0.15")
    + completeness * Decimal("0.10")
)
```

Generate structured `name`, `description`, `instruction`, `triggers`, `examples`, `constraints`, and `business_tags`; store evidence IDs, not raw sensitive records.

- [ ] **Step 4: Implement confirmation transaction**

Lock the candidate, ensure `proposed`, call `KnowledgeSkillService.create`, mark `confirmed`, and commit once.

- [ ] **Step 5: Run and commit**

Run: `cd backend && pytest tests/test_knowledge_skills.py -k candidate -q`
Expected: PASS.

```bash
git add backend/app/services/skill_candidate_service.py backend/tests/test_knowledge_skills.py
git commit -m "feat: extract and confirm skill candidates"
```

### Task 4: Implement retrieval, conflict handling, and prompt assembly

**Files:**
- Create: `backend/app/services/skill_retrieval_service.py`
- Test: `backend/tests/test_skill_retrieval.py`

- [ ] **Step 1: Write failing retrieval tests**

Cover private ownership, published team visibility, disabled-state exclusion, `0.70` threshold, Top 3, private-over-team priority, conflict skip within `0.05`, token trimming, and constraint preservation.

- [ ] **Step 2: Run tests**

Run: `cd backend && pytest tests/test_skill_retrieval.py -q`
Expected: FAIL.

- [ ] **Step 3: Implement normalized first-phase scoring**

Without embeddings, normalize trigger, business tag, historical success, and freshness weights to total `1.0`; do not assign semantic similarity zero while retaining its weight.

- [ ] **Step 4: Implement conflict and XML rendering**

Escape all content, include stable Skill/version identifiers, retain constraints before examples, and return both prompt text and explainable match records.

- [ ] **Step 5: Run and commit**

Run: `cd backend && pytest tests/test_skill_retrieval.py -q`
Expected: PASS.

```bash
git add backend/app/services/skill_retrieval_service.py backend/tests/test_skill_retrieval.py
git commit -m "feat: retrieve knowledge skills for chat"
```

### Task 5: Expose APIs and integrate chat

**Files:**
- Create: `backend/app/routers/knowledge_skills.py`
- Modify: `backend/app/routers/agent_chat.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_knowledge_skills.py`

- [ ] **Step 1: Add failing API tests**

Test list/detail/create-version with `If-Match`, candidate confirm/dismiss, metrics, publish request, feedback, and chat response `used_skills`.

- [ ] **Step 2: Run API tests**

Run: `cd backend && pytest tests/test_knowledge_skills.py -k api -q`
Expected: FAIL with missing routes.

- [ ] **Step 3: Add thin router endpoints**

Map typed service errors to `404`, `409`, and `422`. Derive user identity from authentication context; until project authentication exists, isolate a single `current_user_id()` dependency so it can be replaced without changing services.

- [ ] **Step 4: Update chat contract**

Add `session_id`, `disabled_skill_ids`, and:

```python
class UsedSkill(BaseModel):
    id: str
    name: str
    version: str
    match_score: float
    reason: str
```

Retrieve skills before `run_react_agent`, append the generated Skill block to the system prompt, and persist exact version usages. Candidate extraction runs after the answer and must not block it.

- [ ] **Step 5: Run backend suite and commit**

Run: `cd backend && pytest -q`
Expected: PASS.

```bash
git add backend/app/routers/knowledge_skills.py backend/app/routers/agent_chat.py backend/app/main.py backend/tests/test_knowledge_skills.py
git commit -m "feat: expose knowledge skill APIs"
```

### Task 6: Add frontend contracts and shared center navigation

**Files:**
- Create: `frontend/src/types/knowledgeSkill.ts`
- Create: `frontend/src/lib/api/knowledgeSkills.ts`
- Create: `frontend/src/components/knowledge/KnowledgeCenterNav.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/layout/AppLayout.tsx`

- [ ] **Step 1: Define exact API types**

Create discriminated unions for Skill state, candidate state, and knowledge-library object type. Include `current_version`, `published_version`, `usage_count_30d`, `effectiveness`, `pending_actions`, and relationship summaries.

- [ ] **Step 2: Implement API client methods**

Add list, metrics, candidate actions, create version with `If-Match`, rollback, enable/disable, publish, diff, and feedback methods.

- [ ] **Step 3: Add routes**

```tsx
<Route path="/knowledge" element={<Navigate to="/knowledge/skills" replace />} />
<Route path="/knowledge/skills" element={<KnowledgeSkills />} />
<Route path="/knowledge/library" element={<KnowledgeManagement />} />
```

Keep `/skills` redirecting to `/knowledge/skills`; keep `/memory` available only as a direct debug route.

- [ ] **Step 4: Add shared navigation**

Render “我的 Skill” and “知识库”; render “运营与审核” only when permission data says admin. Use `NavLink` and `aria-current`.

- [ ] **Step 5: Type-check and commit**

Run: `cd frontend && npm run build`
Expected: PASS.

```bash
git add frontend/src/types/knowledgeSkill.ts frontend/src/lib/api/knowledgeSkills.ts frontend/src/components/knowledge/KnowledgeCenterNav.tsx frontend/src/App.tsx frontend/src/components/layout/AppLayout.tsx
git commit -m "feat: add knowledge center navigation"
```

### Task 7: Build the Skill-first page and detail drawer

**Files:**
- Create: `frontend/src/pages/KnowledgeSkills.tsx`
- Create: `frontend/src/components/knowledge/SkillDetailDrawer.tsx`
- Create: `frontend/src/pages/KnowledgeSkills.test.tsx`

- [ ] **Step 1: Write failing component tests**

Mock APIs and assert overview metrics, pending actions, candidate confirmation, Skill-only default table, filters, drawer focus, and version/source/effect tabs.

- [ ] **Step 2: Run tests**

Run: `cd frontend && npm test -- --run src/pages/KnowledgeSkills.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement page sections**

Use existing MUI theme: header actions, capability summary, actionable pending panel, maximum three recommended/recent cards, Skill management table, and responsive relationship drawer.

- [ ] **Step 4: Implement drawer actions**

Support edit, disable/enable, version Diff, rollback confirmation, publish request, source navigation, and usage feedback. Return focus to the triggering row on close.

- [ ] **Step 5: Run tests/build and commit**

Run: `cd frontend && npm test -- --run src/pages/KnowledgeSkills.test.tsx && npm run build`
Expected: PASS.

```bash
git add frontend/src/pages/KnowledgeSkills.tsx frontend/src/components/knowledge/SkillDetailDrawer.tsx frontend/src/pages/KnowledgeSkills.test.tsx
git commit -m "feat: add skill-first management page"
```

### Task 8: Refactor knowledge management into one library

**Files:**
- Modify: `frontend/src/pages/KnowledgeManagement.tsx`
- Create: `frontend/src/components/knowledge/KnowledgeDetailDrawer.tsx`
- Modify: `frontend/src/lib/api/knowledge.ts`
- Create: `frontend/src/pages/KnowledgeManagement.test.tsx`

- [ ] **Step 1: Write failing tests**

Assert no MUI page tabs, one query across knowledge/documents/entities, type filters, per-type status labels, Skill association links, upload/add actions, graph focus, and create-Skill-candidate action.

- [ ] **Step 2: Run tests**

Run: `cd frontend && npm test -- --run src/pages/KnowledgeManagement.test.tsx`
Expected: FAIL because the old three tabs remain.

- [ ] **Step 3: Add unified library API response**

Expose a common row shape with `object_type`, `name`, `summary`, `category`, `status`, `confidence`, `source`, `updated_at`, and `skill_links`, while retaining type-specific detail payloads.

- [ ] **Step 4: Replace tab state**

Remove `tab`, conditional tab loading, and page-level `Tabs`. Load a unified result set and use filter chips `all | knowledge | document | entity`. Keep existing upload, analyze, delete, graph, and tag-generation capabilities behind type-appropriate actions.

- [ ] **Step 5: Implement details and relationships**

Open a right drawer from both rows and graph nodes. Provide “创建 Skill 候选” and “补充到 Skill” actions, never direct activation.

- [ ] **Step 6: Run tests/build and commit**

Run: `cd frontend && npm test -- --run src/pages/KnowledgeManagement.test.tsx && npm run build`
Expected: PASS.

```bash
git add frontend/src/pages/KnowledgeManagement.tsx frontend/src/components/knowledge/KnowledgeDetailDrawer.tsx frontend/src/lib/api/knowledge.ts frontend/src/pages/KnowledgeManagement.test.tsx
git commit -m "feat: unify the knowledge library"
```

### Task 9: Verify the end-to-end lifecycle

**Files:**
- Modify: `backend/tests/test_knowledge_skills.py`
- Modify: `frontend/src/pages/KnowledgeSkills.test.tsx`
- Modify: `frontend/src/pages/KnowledgeManagement.test.tsx`

- [ ] **Step 1: Add lifecycle integration coverage**

Cover correction → candidate → confirmation → Skill `1.0.0` → later chat match → usage record → version `1.1.0` → publication → another user match → old version replay.

- [ ] **Step 2: Run all automated checks**

Run: `cd backend && pytest -q`
Expected: PASS.

Run: `cd frontend && npm test -- --run`
Expected: PASS.

Run: `cd frontend && npm run build`
Expected: PASS.

- [ ] **Step 3: Perform browser QA**

Start the existing app, verify desktop and mobile widths, keyboard navigation, focus restoration, loading/empty/error states, route redirects, Skill filtering, knowledge filtering, drawer actions, and graph/list synchronization.

- [ ] **Step 4: Check repository scope**

Run: `git status --short`
Expected: only intentional implementation files plus the user’s pre-existing unrelated changes.

- [ ] **Step 5: Commit final integration adjustments**

```bash
git add backend/tests/test_knowledge_skills.py frontend/src/pages/KnowledgeSkills.test.tsx frontend/src/pages/KnowledgeManagement.test.tsx
git commit -m "test: verify knowledge skill lifecycle"
```
