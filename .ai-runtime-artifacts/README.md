# AI Runtime Artifacts

AI 工作流过程产物目录。按 `harness/core/artifacts.md` 规范组织。

## 子目录

- `specs/` — 需求规格说明（spec）
- `plans/` — 实施计划
- `reviews/` — 代码评审记录
- `verifications/` — 验证报告
- `decisions/` — 架构决策记录
- `retros/` — 回顾总结

所有 artifact 文件必须以 YAML front matter 开头：

```yaml
---
artifact: <类型>
route: <路由>
skills:
  - <使用的技能>
source:
  - <参考源文件>
created_at: <ISO 日期>
---
```
