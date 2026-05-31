.PHONY: dev dev-frontend dev-admin dev-mcp dev-backend dev-agent install migrate-up migrate-down

# 安装所有 JS/TS 依赖
install:
	pnpm install

# 数据库迁移
migrate-up:
	cd services/backend && go run main.go migrate-up

migrate-down:
	cd services/backend && go run main.go migrate-down

# 启动所有服务（并行）
dev:
	make -j4 dev-frontend dev-backend dev-agent dev-mcp

# JS/TS 应用
dev-frontend:
	pnpm --filter @link-do/frontend dev

dev-admin:
	pnpm --filter @link-do/admin dev

dev-mcp:
	pnpm --filter @link-do/mcp dev

# 后端服务
dev-backend:
	cd services/backend && go run main.go

dev-agent:
	cd services/agent && uv run python -m app.main

# 构建
build-frontend:
	pnpm --filter @link-do/frontend build

build-admin:
	pnpm --filter @link-do/admin build

# 代码检查
lint:
	pnpm -r lint

typecheck:
	pnpm -r typecheck

format-check:
	pnpm -r format:check
format:
	pnpm -r format
