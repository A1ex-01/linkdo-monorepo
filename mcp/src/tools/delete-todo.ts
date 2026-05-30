import { getCollections, getTasksByCollection, deleteTask } from "../client.js";
import type { ITask } from "../types.js";

export type DeleteTodoArgs = {
  task_uuid: string;
  confirm?: boolean;
};

async function findTask(taskUuid: string, token?: string): Promise<ITask | null> {
  const collectionsRes = await getCollections(token, false);
  if (!collectionsRes.success || !collectionsRes.data) return null;

  for (const col of collectionsRes.data) {
    const tasksRes = await getTasksByCollection(col.uuid, token);
    if (tasksRes.success && tasksRes.data) {
      const found = tasksRes.data.find((t) => t.uuid === taskUuid);
      if (found) return found;
    }
  }
  return null;
}

export async function handler(args: DeleteTodoArgs, token?: string) {
  if (!args.task_uuid || args.task_uuid.trim().length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: "删除 Todo 失败: task_uuid 不能为空。",
        },
      ],
    };
  }

  const task = await findTask(args.task_uuid, token);

  if (!task) {
    return {
      content: [
        {
          type: "text" as const,
          text: `未找到 UUID 为 ${args.task_uuid} 的 Todo。`,
        },
      ],
    };
  }

  if (!args.confirm) {
    return {
      content: [
        {
          type: "text" as const,
          text:
            `⚠️ **确认删除 Todo**\n\n` +
            `- 标题: ${task.title}\n` +
            `- 状态: ${task.status}\n` +
            `- UUID: ${task.uuid}\n` +
            `- 预估时间: ${task.estimated_time} 分钟\n\n` +
            `请再次调用 delete_todo，并将 confirm 设为 true 以确认删除。`,
        },
      ],
    };
  }

  const res = await deleteTask(args.task_uuid, token);

  if (!res.success) {
    return {
      content: [
        {
          type: "text" as const,
          text: `删除 Todo 失败: ${res.error ?? res.message ?? "未知错误"}`,
        },
      ],
    };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: `✅ Todo 已删除: "${task.title}" (${task.uuid})`,
      },
    ],
  };
}
