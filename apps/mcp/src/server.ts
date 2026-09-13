import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "node:crypto";
import { handler as getCollections } from "./tools/get-collections.js";
import { handler as getTodos } from "./tools/get-todos.js";
import { handler as createTodo } from "./tools/create-todo.js";
import { handler as updateTodo } from "./tools/update-todo.js";
import { handler as deleteTodo } from "./tools/delete-todo.js";

function extractToken(
  extra: RequestHandlerExtra<any, any>,
): string | undefined {
  return extra.requestInfo?.headers?.authorization
    ?.toString()
    .replace("Bearer ", "");
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: "linkdo-mcp",
    version: "1.0.0",
  });

  server.registerTool(
    "get_collections",
    {
      title: "Get Collections",
      description:
        "获取当前用户的所有 Collection（分组）。返回 uuid、name、icon、pending_count，用于后续创建/查询 Todo。",
      inputSchema: {
        includeArchived: z
          .boolean()
          .optional()
          .default(false)
          .describe("是否包含已归档的 Collection，默认 false"),
      },
    },
    async (args, extra) =>
      getCollections(
        args as { includeArchived?: boolean },
        extractToken(extra),
      ),
  );

  server.registerTool(
    "get_todos",
    {
      title: "Get Todos",
      description:
        "获取用户的 Todo 列表，按状态分组（Backlog / This Week / Today / Done）。可按 collection 或 status 过滤。返回时自动截断至 100 条。",
      inputSchema: {
        collection_uuid: z
          .string()
          .optional()
          .describe("限定在某个 Collection 内查询"),
        status: z
          .enum(["backlog", "this_week", "today", "done"])
          .optional()
          .describe("按状态过滤"),
        limit: z
          .number()
          .optional()
          .default(100)
          .describe("最多返回条数，默认 100"),
      },
    },
    async (args, extra) =>
      getTodos(
        args as { collection_uuid?: string; status?: string; limit?: number },
        extractToken(extra),
      ),
  );

  server.registerTool(
    "create_todo",
    {
      title: "Create Todo",
      description:
        "创建一个新的 Todo item，自动分配到指定 Collection（默认第一个 Collection）。支持传入任务背景用于参考。",
      inputSchema: {
        title: z.string().describe("任务标题，简洁清晰"),
        collection_uuid: z
          .string()
          .optional()
          .describe("目标 Collection UUID，留空则使用默认 Collection"),
        estimated_time: z.number().optional().describe("预估时间（分钟）"),
        context: z
          .string()
          .optional()
          .describe("任务背景/备注，供 AI 参考估时"),
        status: z
          .enum(["backlog", "this_week", "today", "done"])
          .optional()
          .default("backlog")
          .describe("初始状态，默认 backlog"),
      },
    },
    async (args, extra) =>
      createTodo(
        args as {
          title: string;
          collection_uuid?: string;
          estimated_time?: number;
          context?: string;
          status?: string;
        },
        extractToken(extra),
      ),
  );

  server.registerTool(
    "update_todo",
    {
      title: "Update Todo",
      description:
        "更新一个已存在的 Todo：修改标题、预估时间，或移动状态（backlog/this_week/today/done）。更新 status 会同步到 Notion。",
      inputSchema: {
        task_uuid: z.string().describe("待更新任务的 UUID（格式 tk_xxx）"),
        title: z.string().optional().describe("新标题"),
        estimated_time: z.number().optional().describe("新预估时间（分钟）"),
        status: z
          .enum(["backlog", "this_week", "today", "done"])
          .optional()
          .describe("新状态"),
      },
    },
    async (args, extra) =>
      updateTodo(
        args as {
          task_uuid: string;
          title?: string;
          estimated_time?: number;
          status?: string;
        },
        extractToken(extra),
      ),
  );

  server.registerTool(
    "delete_todo",
    {
      title: "Delete Todo",
      description:
        "请求删除一个 Todo。危险操作，返回待删除任务详情供确认，不会立即执行。",
      inputSchema: {
        task_uuid: z.string().describe("待删除任务的 UUID（格式 tk_xxx）"),
        confirm: z
          .boolean()
          .optional()
          .default(false)
          .describe("确认为 true 时才真正删除，否则只返回预览"),
      },
    },
    async (args, extra) =>
      deleteTodo(
        args as { task_uuid: string; confirm?: boolean },
        extractToken(extra),
      ),
  );

  return server;
}

export function createTransport(): StreamableHTTPServerTransport {
  return new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });
}
