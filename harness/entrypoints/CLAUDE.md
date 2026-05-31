# CLAUDE.md

项目背景：{{PROJECT_BACKGROUND}}

---

## Harness Rules (MANDATORY)

This project uses `harness/` engineering standards. Rules below are auto-effective per session.

### Pre-task Checklist

Before any **non-trivial** task, you MUST:

1. Read `harness/project.profile.md` and `harness/context-map.md`
2. Route the task using the table below, declare the route
3. Follow the corresponding runbook, write artifacts to `.ai-runtime-artifacts/`

### Routing Table

| Task Type | Route | Artifact Dir |
|-----------|-------|--------------|
| Requirements / Design / Behavior Change | `superpowers:brainstorming` | `.ai-runtime-artifacts/specs/` |
| Implementation Plan | `superpowers:writing-plans` | `.ai-runtime-artifacts/plans/` |
| Multi-task Coding / Parallel Impl | `superpowers:subagent-driven-development` | `.ai-runtime-artifacts/execution-logs/` + code changes |
| Code Review / Verification | `superpowers:verification-before-completion` | `.ai-runtime-artifacts/verifications/` |
| Bug Investigation | `superpowers:systematic-debugging` | `.ai-runtime-artifacts/verifications/` |
| Architecture Decision | architect / critic / planner | `.ai-runtime-artifacts/decisions/` |
| Trivial Change / Single-file Mechanical Edit | Handle directly | No artifact needed |

### "Trivial Change" Criteria

The following are **NOT** trivial — MUST produce artifacts:

- Code review or diff analysis involving 3+ files
- User explicitly asks to "审核", "review", or "check" code quality
- Verification step at the end of an implementation flow (even if user doesn't say "verify")
- Analysis requiring cross-module understanding

### Runbook Summary

**New Feature:** spec (specs/) → plan decision (write plan if complex, skip otherwise) → coding (MUST use `superpowers:subagent-driven-development`) → execution-log (execution-logs/) → verification (verifications/)

**Bug Fix:** root cause → fix (MUST use `superpowers:subagent-driven-development`) → execution-log (execution-logs/) → verification (verifications/)

**Architecture Decision:** compare options → decision record (decisions/), MUST include accepted/rejected options, constraints, and risks

### Artifact Format

Every artifact file MUST start with YAML front matter containing: `artifact`, `route`, `skills`, `source`, `created_at`. See `harness/core/artifacts.md`.

### Constraints

- **MANDATORY declaration (every task):** First line of response MUST be `「Harness：<route or "小改动，直接处理">」`. This proves routing was evaluated. For trivial tasks, print declaration then proceed directly.
- **User intervention when undeclared:** If AI response does not start with `「Harness：...」`, the rules were not loaded. User should send: `请先读取 CLAUDE.md 和 harness/core/routing.md，按 harness 规范重新处理我的上一个请求。`
- Before non-trivial tasks, declare route, skills, and source
- Any completion claim MUST have verification evidence
- Default route is mandatory baseline; user-specified skills are additive, not replacement

---

详细规范参见：`harness/core/routing.md`、`harness/core/artifacts.md`、`harness/core/runbooks.md`、`harness/core/verification.md`。

若本文件与 `AGENTS.md` 有冲突，以 `AGENTS.md` 为准。
