// desktop/src/app/work/content.tsx

"use client";

import { WorkHeader } from "@/app/work/_components/header";
import BottomNav from "@/components/bottom-nav";
import { LoadingScreen } from "@/components/motion/loading-screen";
import { WindowTitleBar } from "@/components/window-title-bar";
import { cn } from "@/lib/utils";
import { useCommonStore } from "@/stores/common";
import { IconLoader } from "@tabler/icons-react";
import { useState } from "react";
import { CapsuleBoard } from "./_components/capsule-board";
import { KanbanBoard } from "./_components/kanban-board";
import { SidebarBoard } from "./_components/sidebar-board";
import { useData } from "./data-provider";

export default function Content() {
  const { viewMode, collection } = useData();
  const {
    currCollectionClickUpLists,
    isFetchingCurrCollectionClickUpLists,
    isFetchingCurrCollectionNotionDbs,
    currCollectionNotionDbs,
  } = useCommonStore();

  const [isLoadingScreen, setIsLoadingScreen] = useState(true);

  if (isLoadingScreen) {
    if (!collection) return <IconLoader />;
    if (isFetchingCurrCollectionClickUpLists) return <IconLoader />;
    const hasClickUp = currCollectionClickUpLists.length > 0;
    const hasNotion = currCollectionNotionDbs.length > 0;
    return (
      <LoadingScreen
        icons={
          [
            {
              type: "linkdo",
            },
            collection?.cover
              ? {
                  type: "url",
                  value: collection?.cover,
                }
              : {
                  type: "name",
                  value: collection?.name?.slice(0, 1),
                },
            hasNotion && {
              type: "notion",
            },
            hasClickUp && {
              type: "clickup",
            },
          ]?.filter(Boolean) as {
            type: "linkdo" | "url" | "name" | "notion" | "clickup";
            value?: string;
          }[]
        }
        loadId="home"
        onComplete={() => {
          setIsLoadingScreen(false);
        }}
      />
    );
  }

  return (
    <div className="bg-background text-foreground flex h-full flex-col">
      {viewMode === "kanban" && (
        <>
          <WindowTitleBar />
          <WorkHeader />
        </>
      )}

      <main
        className={cn(
          "flex-1 overflow-y-hidden",
          viewMode === "kanban" && "p-4",
        )}
      >
        {viewMode === "sidebar" ? (
          <SidebarBoard />
        ) : viewMode === "kanban" ? (
          <KanbanBoard />
        ) : (
          <CapsuleBoard />
        )}
      </main>
      {viewMode === "kanban" && <BottomNav />}
    </div>
  );
}
