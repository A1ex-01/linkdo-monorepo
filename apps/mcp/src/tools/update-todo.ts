import { updateTask, updateTaskStatus } from "../client.js";

export type UpdateTodoArgs = {
  task_uuid: string;
  title?: string;
  estimated_time?: number;
  status?: string;
};

export async function handler(args: UpdateTodoArgs, token?: string) {
  if (!args.task_uuid || args.task_uuid.trim().length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: "更新 Todo 失败: task_uuid 不能为空。",
        },
      ],
    };
  }

  if (!args.title && args.estimated_time === undefined && !args.status) {
    return {
      content: [
        {
          type: "text" as const,
          text: "更新 Todo 失败: 至少需要提供 title、estimated_time 或 status 其中之一。",
        },
      ],
    };
  }

  if (args.title !== undefined || args.estimated_time !== undefined) {
    const res = await updateTask(args.task_uuid, {
      title: args.title,
      estimated_time: args.estimated_time,
    }, token);
    if (!res.success) {
      return {
        content: [
          {
            type: "text" as const,
            text: `更新 Todo 失败: ${res.error ?? res.message ?? "未知错误"}`,
          },
        ],
      };
    }
  }

  if (args.status) {
    const res = await updateTaskStatus(args.task_uuid, args.status, token);
    if (!res.success) {
      return {
        content: [
          {
            type: "text" as const,
            text: `更新 Todo 状态失败: ${res.error ?? res.message ?? "未知错误"}`,
          },
        ],
      };
    }
  }

  const changes: string[] = [];
  if (args.title) changes.push(`标题: "${args.title}"`);
  if (args.estimated_time !== undefined) changes.push(`预估时间: ${args.estimated_time} 分钟`);
  if (args.status) changes.push(`状态: ${args.status}`);

  return {
    content: [
      {
        type: "text" as const,
        text: `✅ Todo 更新成功！\n\n- UUID: ${args.task_uuid}\n- 变更: ${changes.join(" | ")}`,
      },
    ],
  };
}
