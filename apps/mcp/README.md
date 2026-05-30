# Link-Do MCP Server

Model Context Protocol server for Link-Do task management.
Auth is handled by the **Link-Do backend** via standard OAuth 2.0.

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env — LINKDO_API_BASE_URL must point to the backend

# 3. Start development server
pnpm dev

# Or build and run production:
pnpm build && pnpm start
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `LINKDO_API_BASE_URL` | Yes | `http://localhost:8080` | Link-Do backend URL (must include OAuth endpoints) |
| `MCP_HOST` | No | `127.0.0.1` | MCP server bind address |
| `MCP_PORT` | No | `3001` | MCP server port |

**No `LINKDO_API_TOKEN` needed** — authentication is per-user via OAuth 2.0.

## How OAuth Works

```
Cursor/Claude Desktop
    ↓ (connects to MCP Server URL)
MCP Server (/mcp)  ← Bearer token in Authorization header
    ↓ (verifies token via backend /oauth/introspect)
Link-Do Backend
    ↓ (issues tokens via standard OAuth endpoints)
GET  /.well-known/oauth-authorization-server  → returns metadata
GET  /oauth/authorize                         → login form
POST /oauth/login                             → validates Link-Do token, issues code
POST /oauth/token                             → exchanges code → MCP token
POST /oauth/introspect                        → verifies MCP token
```

When a user first connects, they enter their Link-Do API token on the login page.
The backend validates it and issues an MCP-specific token (1hr TTL).

## Claude Desktop Integration

Add to `~/.claude/desktop_mcp_servers.json`:

```json
{
  "mcpServers": {
    "linkdo": {
      "command": "node",
      "args": ["/absolute/path/to/link-do/mcp/dist/index.js"],
      "env": {
        "LINKDO_API_BASE_URL": "http://localhost:8080"
      }
    }
  }
}
```

**Note:** The OAuth login flow happens in the browser when first connecting.
You may need to temporarily allow browser redirects from `localhost`.

## Available Tools

| Tool | Description |
|---|---|
| `get_collections` | List all Collections |
| `get_todos` | Get Todos grouped by status (max 100) |
| `create_todo` | Create a new Todo |
| `update_todo` | Update title, time, or status |
| `delete_todo` | Delete a Todo (requires confirm=true) |
