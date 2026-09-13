import { describe, expect, it } from "vitest";
import { buildTaskLinkTargets } from "./link-targets";

describe("buildTaskLinkTargets", () => {
  it("keeps Notion databases and ClickUp lists as distinct task targets", () => {
    const targets = buildTaskLinkTargets(
      [
        {
          uuid: "notion-db-uuid",
          collection_uuid: "collection-uuid",
          notion_database_id: "notion-db-id",
          created_at: "",
          updated_at: "",
          title: "Roadmap",
          name: "Roadmap",
        },
      ],
      [
        {
          uuid: "clickup-list-uuid",
          collection_uuid: "collection-uuid",
          workspace_id: "workspace-id",
          space_id: "space-id",
          clickup_list_id: "list-id",
          name: "Engineering",
          created_at: "",
          updated_at: "",
        },
      ],
    );

    expect(targets).toEqual([
      { value: "notion:notion-db-uuid", platform: "notion", uuid: "notion-db-uuid", label: "Roadmap" },
      { value: "clickup:clickup-list-uuid", platform: "clickup", uuid: "clickup-list-uuid", label: "Engineering" },
    ]);
  });
});
