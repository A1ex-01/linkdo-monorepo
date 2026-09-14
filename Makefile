SHELL := /bin/bash
.PHONY: dev dev-frontend dev-admin dev-mcp dev-backend dev-agent install migrate-up migrate-down stop

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
	pnpm --filter @linkdo/frontend dev

dev-admin:
	pnpm --filter @linkdo/admin dev

dev-mcp:
	pnpm --filter @linkdo/mcp dev

# 后端服务
dev-backend:
	cd services/backend && go run main.go

dev-agent:
	cd services/agent && uv run python -m app.main

# 构建
build-frontend:
	pnpm --filter @linkdo/frontend build

build-admin:
	pnpm --filter @linkdo/admin build

# 代码检查
lint:
	pnpm -r lint

typecheck:
	pnpm -r typecheck

format-check:
	pnpm -r format:check
format:
	pnpm -r format


stop:
	@ports=(6001 6002 6003 6004 6005 6006); \
	pids=(); \
	for port in "$${ports[@]}"; do \
		while IFS= read -r pid; do \
			[[ -z "$$pid" || " $${pids[*]} " == *" $$pid "* ]] || pids+=("$$pid"); \
		done < <(lsof -tiTCP:"$$port" -sTCP:LISTEN 2>/dev/null || true); \
	done; \
	if [[ "$${#pids[@]}" -gt 0 ]]; then \
		printf 'Stopping listener PIDs: %s\n' "$${pids[*]}"; \
		for pid in "$${pids[@]}"; do kill -TERM "$$pid" 2>/dev/null || true; done; \
		sleep 2; \
	fi; \
	remaining_pids=(); \
	for port in "$${ports[@]}"; do \
		while IFS= read -r pid; do \
			[[ -z "$$pid" || " $${remaining_pids[*]} " == *" $$pid "* ]] || remaining_pids+=("$$pid"); \
		done < <(lsof -tiTCP:"$$port" -sTCP:LISTEN 2>/dev/null || true); \
	done; \
	if [[ "$${#remaining_pids[@]}" -gt 0 ]]; then \
		printf 'Force stopping listener PIDs: %s\n' "$${remaining_pids[*]}"; \
		for pid in "$${remaining_pids[@]}"; do kill -KILL "$$pid" 2>/dev/null || true; done; \
		sleep 1; \
	fi; \
	status=0; \
	for port in "$${ports[@]}"; do \
		listeners="$$(lsof -tiTCP:"$$port" -sTCP:LISTEN 2>/dev/null | tr '\n' ' ' || true)"; \
		if [[ -z "$$listeners" ]]; then \
			printf 'Port %s: stopped or not in use.\n' "$$port"; \
		else \
			printf 'Port %s: still listening (PIDs: %s).\n' "$$port" "$$listeners" >&2; \
			status=1; \
		fi; \
	done; \
	exit "$$status"