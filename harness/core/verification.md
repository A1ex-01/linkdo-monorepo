# Verification Gates

## 通用门禁

完成声明前必须至少说明：

- 执行过的验证命令。
- 命令是否通过。
- 未验证项和原因。
- 是否存在残留风险。

## Harness 文档验证

```bash
rg -n "T[B]D|T[O]DO|FIX[M]E|待[定]|占[位]" AGENTS.md CLAUDE.md GEMINI.md .cursor .agents harness .ai-runtime-artifacts
bash -n harness/scripts/install-ai-skills.sh
bash -n harness/scripts/harness-init.sh
bash -n harness/scripts/harness-check.sh
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('package-json-ok')"
git status --short
```

## AI 环境验证

```bash
# superpowers skills（必需）
npx skills add obra/superpowers -g
```

## 应用验证

根据改动范围选择：

```bash
# 桌面端（前端）
pnpm --filter @link-do/frontend build

# 管理后台
pnpm --filter @link-do/admin build

# MCP Server
pnpm --filter @link-do/mcp build

# 或通过 Makefile
make build-frontend
make build-admin
```

如果只改 Harness 文档和规则，不要求运行应用构建。
