import { getCollections, createTask } from "../client.js";
import type { ITask } from "../types.js";

export type CreateTodoArgs = {
  title: string;
  collection_uuid?: string;
  estimated_time?: number;
  context?: string;
  status?: string;
};

export async function handler(args: CreateTodoArgs, token?: string) {
  if (!args.title || args.title.trim().length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: "创建 Todo 失败: 任务标题不能为空。",
        },
      ],
    };
  }

  let targetCollectionUuid = args.collection_uuid;

  if (!targetCollectionUuid) {
    const res = await getCollections(token, false);
    if (!res.success || !res.data || res.data.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: "创建 Todo 失败: 没有可用的 Collection。请先指定 collection_uuid。",
          },
        ],
      };
    }
    targetCollectionUuid = res.data[0]?.uuid;
  }

  if (!targetCollectionUuid) {
    return {
      content: [
        {
          type: "text" as const,
          text: "创建 Todo 失败: 没有可用的 Collection。请先指定 collection_uuid。",
        },
      ],
    };
  }

  const body: { title: string; estimated_time?: number; status?: string } = {
    title: args.title,
  };
  if (args.status) {
    body.status = args.status;
  }
  if (args.estimated_time !== undefined) {
    body.estimated_time = args.estimated_time;
  }

  console.log("🐽🐽 ~ create-todo.ts ~ handler ~ token:", token);
  const res = await createTask(targetCollectionUuid, body, token);

  if (!res.success || !res.data) {
    return {
      content: [
        {
          type: "text" as const,
          text: `创建 Todo 失败: ${res.error ?? res.message ?? "未知错误"}`,
        },
      ],
    };
  }

  const task: ITask = res.data;
  const timeNote =
    task.estimated_time > 0 ? `, 预估 ${task.estimated_time} 分钟` : "";

  return {
    content: [
      {
        type: "text" as const,
        text:
          `✅ Todo 创建成功！\n\n` +
          `- 标题: ${task.title}\n` +
          `- 状态: ${task.status}\n` +
          `- UUID: ${task.uuid}${timeNote}\n` +
          `- 创建时间: ${task.created_at}`,
      },
    ],
  };
}
