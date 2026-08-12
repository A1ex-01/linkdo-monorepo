// frontend/src/app/work/content.tsx

"use client";

import { WorkHeader } from "@/app/work/_components/header";
import { WindowTitleBar } from "@/components/window-title-bar";
import { cn } from "@/lib/utils";
import { CapsuleBoard } from "./_components/capsule-board";
import { KanbanBoard } from "./_components/kanban-board";
import { SidebarBoard } from "./_components/sidebar-board";
import { useData } from "./data-provider";
import BottomNav from "@/components/bottom-nav";

export default function Content() {
  const { viewMode } = useData();

  return (
    <div className="flex h-full flex-col bg-[#111111] text-white">
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
