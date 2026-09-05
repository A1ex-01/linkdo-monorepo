import type { IClickUpList, INotionDatabase } from "@/types/base";

export type TaskLinkTargetPlatform = "notion" | "clickup";

export interface TaskLinkTargetOption {
  value: string;
  platform: TaskLinkTargetPlatform;
  uuid: string;
  label: string;
}

export function buildTaskLinkTargets(
  notionDatabases: INotionDatabase[],
  clickUpLists: IClickUpList[],
): TaskLinkTargetOption[] {
  return [
    ...notionDatabases.map((db) => ({
      value: `notion:${db.uuid}`,
      platform: "notion" as const,
      uuid: db.uuid,
      label: db.name || db.title || "Untitled database",
    })),
    ...clickUpLists.map((list) => ({
      value: `clickup:${list.uuid}`,
      platform: "clickup" as const,
      uuid: list.uuid,
      label: list.name || "Untitled list",
    })),
  ];
}

export function splitTaskLinkTarget(value: string) {
  const [platform, uuid] = value.split(":", 2);
  if ((platform !== "notion" && platform !== "clickup") || !uuid) {
    return null;
  }
  return { platform, uuid };
}
