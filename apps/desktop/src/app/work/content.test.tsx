import { render, screen, waitFor } from "@testing-library/react";
import React, { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";

import Content from "./content";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

vi.mock("./data-provider", () => ({
  useData: () => ({
    viewMode: "kanban",
    collection: {
      uuid: "collection-1",
      name: "日程管理",
      cover: "",
    },
  }),
}));

vi.mock("@/stores/common", () => ({
  useCommonStore: () => ({
    currCollectionClickUpLists: [],
    isFetchingCurrCollectionClickUpLists: false,
    isFetchingCurrCollectionNotionDbs: false,
    currCollectionNotionDbs: [],
  }),
}));

vi.mock("@/components/motion/loading-screen", () => ({
  LoadingScreen: ({ onComplete }: { onComplete: () => void }) => {
    useEffect(() => {
      onComplete();
    }, [onComplete]);
    return <div>loading work</div>;
  },
}));

vi.mock("@/components/ai-chat", () => ({
  default: () => <div data-testid="linkdo-ai-chat" />,
}));

vi.mock("@/components/window-title-bar", () => ({
  WindowTitleBar: () => <div />,
}));

vi.mock("@/app/work/_components/header", () => ({
  WorkHeader: () => <div />,
}));

vi.mock("@/components/bottom-nav", () => ({
  default: () => <div />,
}));

vi.mock("./_components/kanban-board", () => ({
  KanbanBoard: () => <div />,
}));

vi.mock("./_components/sidebar-board", () => ({
  SidebarBoard: () => <div />,
}));

vi.mock("./_components/capsule-board", () => ({
  CapsuleBoard: () => <div />,
}));

describe("work Content", () => {
  it("mounts Linkdo AI chat after the work UI finishes loading", async () => {
    render(<Content />);

    await waitFor(() => {
      expect(screen.getByTestId("linkdo-ai-chat")).toBeTruthy();
    });
  });
});
