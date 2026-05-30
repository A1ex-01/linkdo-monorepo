import { getCollections } from "../client.js";
import type { ICollection } from "../types.js";

const MAX_COLLECTIONS = 50;

export type GetCollectionsArgs = {
  includeArchived?: boolean;
};

export async function handler(args: GetCollectionsArgs, token?: string) {
  const res = await getCollections(token, args.includeArchived ?? false);

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

  const collections: ICollection[] = res.data;
  const filtered = args.includeArchived
    ? collections
    : collections.filter((c) => !c.is_archived);
  const truncated = filtered.slice(0, MAX_COLLECTIONS);
  const truncatedNote =
    filtered.length > MAX_COLLECTIONS
      ? `\n（共 ${filtered.length} 个 Collection，已截断至前 ${MAX_COLLECTIONS} 个）`
      : "";

  const lines = truncated.map(
    (c) =>
      `- [${c.icon}] **${c.name}** (uuid: ${c.uuid}, pending: ${c.pending_count}, estimated: ${c.estimated_total}min)${c.is_archived ? " [archived]" : ""}`
  );

  return {
    content: [
      {
        type: "text" as const,
        text: lines.length > 0
          ? `## Collections (${truncated.length}${truncatedNote})\n\n${lines.join("\n")}`
          : "当前没有任何 Collection。",
      },
    ],
  };
}
