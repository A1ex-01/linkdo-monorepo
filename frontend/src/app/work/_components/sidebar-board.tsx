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
            "relative flex h-full flex-1 flex-col overflow-hidden overflow-y-scroll bg-[#181818] p-4",
          )}
        >
          <div
            data-tauri-drag-region
            className="flex w-full shrink-0 cursor-pointer items-center justify-between"
          >
            <div className="text-xl font-bold text-white">{"Today"}</div>
            <div className="actions">
              <IconHome
                className="text-atext-450 cursor-pointer"
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
          <div className="mt-4 flex flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto">
            {todayTasks.map((task) =>
              task.uuid === timerInfo?.task_uuid ? (
                <CardSimpleItem item={task} />
              ) : (
                <TaskCardItem item={task} key={task.uuid} />
              ),
            )}
          </div>
          <Button
            size={"lg"}
            onClick={() => {
              setViewMode("capsule");
              enterCapsule();
            }}
            variant={"outline"}
          >
            Focus on task
          </Button>
        </div>
      </div>
    </div>
  );
}
