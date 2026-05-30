import { getCollections, getTasksByCollection } from "../client.js";
import type { ITask, TaskStatus } from "../types.js";

const MAX_TODOS = 100;

export type GetTodosArgs = {
  collection_uuid?: string;
  status?: string;
  limit?: number;
};

function formatTask(task: ITask): string {
  const time = task.estimated_time > 0 ? ` (${task.estimated_time}min)` : "";
  const completed = task.completed_at ? ` [done: ${task.completed_at}]` : "";
  return `  - [${task.status}] ${task.title}${time} (uuid: ${task.uuid})${completed}`;
}

function groupByStatus(tasks: ITask[]): Record<TaskStatus, ITask[]> {
  return {
    backlog: tasks.filter((t) => t.status === "backlog"),
    this_week: tasks.filter((t) => t.status === "this_week"),
    today: tasks.filter((t) => t.status === "today"),
    done: tasks.filter((t) => t.status === "done"),
  };
}

export async function handler(args: GetTodosArgs, token?: string) {
  const limit = Math.min(args.limit ?? MAX_TODOS, MAX_TODOS);

  let collectionUuids: string[] = [];

  if (args.collection_uuid) {
    collectionUuids = [args.collection_uuid];
  } else {
    const res = await getCollections(token, false);
    if (!res.success || !res.data) {
      return {
        content: [
          {
            type: "text" as const,
            text: `获取 Collection 列表失败: ${res.error ?? res.message ?? "未知错误"}`,
          },
        ],
      };
    }
    collectionUuids = res.data.map((c) => c.uuid);
  }

  const allTasks: ITask[] = [];
  for (const uuid of collectionUuids) {
    const res = await getTasksByCollection(uuid, token);
    if (res.success && res.data) {
      allTasks.push(...res.data);
    }
  }

  let filtered = allTasks;
  if (args.status) {
    filtered = filtered.filter((t) => t.status === args.status);
  }

  const sorted = filtered.sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
  const truncated = sorted.slice(0, limit);
  const truncatedNote =
    sorted.length > limit ? `\n（共 ${sorted.length} 条 Todo，已截断至前 ${limit} 条）` : "";

  const grouped = groupByStatus(truncated);

  const lines: string[] = [];
  for (const [status, tasks] of Object.entries(grouped) as [TaskStatus, ITask[]][]) {
    if (tasks.length > 0) {
      lines.push(`\n### ${status.toUpperCase().replace("_", " ")} (${tasks.length})`);
      lines.push(...tasks.map(formatTask));
    }
  }

  return {
    content: [
      {
        type: "text" as const,
        text: lines.length > 0
          ? `## Todos (${truncated.length}${truncatedNote})\n\n${lines.join("\n")}`
          : "当前没有任何 Todo。",
      },
    ],
  };
}
