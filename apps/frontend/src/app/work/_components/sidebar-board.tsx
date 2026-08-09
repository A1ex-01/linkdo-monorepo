"use client";

import { useData } from "@/app/work/data-provider";
import TaskCardItem, { CardSimpleItem } from "@/components/task-card-item";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IconHome } from "@tabler/icons-react";
import { useMemo } from "react";

interface SidebarBoardProps {}

export function SidebarBoard({}: SidebarBoardProps) {
  const {
    tasks,
    exitSidebar,
    timerInfo,
    handleStopFocus,
    handleSwitchFocus,
    getTasks,
    setViewMode,
    enterCapsule,
  } = useData();
  const todayTasks = useMemo(() => {
    return tasks?.filter((task) => task.status === "today") ?? [];
  }, [tasks]);

  return (
    <div className="flex h-full w-[343px] flex-col gap-8">
      <div className="flex h-full justify-center gap-6">
        <div
          className={cn(
            "text-card-foreground relative flex h-full flex-1 flex-col overflow-hidden overflow-y-scroll rounded-2xl border border-[#2a2a2a] bg-[#1d1d1d] p-5 shadow-sm",
          )}
        >
          <div
            data-tauri-drag-region
            className="flex w-full shrink-0 cursor-pointer items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="bg-primary size-2 rounded-full" />
              <div className="text-card-foreground text-xl font-bold">
                {"Today"}
              </div>
              <div className="text-atext-460 ml-1 text-xs font-normal">
                {`${todayTasks.length} tasks`}
              </div>
            </div>
            <div className="actions">
              <IconHome
                className="text-atext-460 cursor-pointer transition-colors hover:text-atext-500"
                onClick={async () => {
                  exitSidebar();
                  if (timerInfo) {
                    await handleStopFocus();
                    getTasks();
                  }
                }}
              />
            </div>
          </div>
          <div className="mt-5 flex flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto">
            {todayTasks.map((task) =>
              task.uuid === timerInfo?.task_uuid ? (
                <CardSimpleItem
                  key={task.uuid}
                  item={task}
                  onStartFocus={handleSwitchFocus}
                />
              ) : (
                <TaskCardItem
                  item={task}
                  key={task.uuid}
                  onStartFocus={handleSwitchFocus}
                />
              ),
            )}
          </div>
          <Button
            size={"lg"}
            onClick={() => {
              setViewMode("capsule");
              enterCapsule();
            }}
            className="bg-primary-400 hover:bg-primary-400/90 mt-4 rounded-full text-white shadow-sm"
          >
            Focus on task
          </Button>
        </div>
      </div>
    </div>
  );
}
