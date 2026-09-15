"use client";

import { useData } from "@/app/work/data-provider";
import TaskCardItem, { CardSimpleItem } from "@/components/task-card-item";
import { Button } from "@linkdo/ui/components/button";
import { Progress } from "@linkdo/ui/components/progress";
import { cn } from "@/lib/utils";
import type { ITask } from "@/types/base";
import { IconHome, IconPlus } from "@tabler/icons-react";
import { useCallback, useMemo, useState } from "react";

interface SidebarBoardProps {}

export function SidebarBoard({}: SidebarBoardProps) {
  const {
    tasks,
    exitSidebar,
    timerInfo,
    handleStopFocus,
    handleSwitchFocus,
    handleStartFocus,
    markAsDone,
    getTasks,
    setViewMode,
    enterCapsule,
  } = useData();

  const todayTasks = useMemo(() => {
    return tasks?.filter((task) => task.status === "today") ?? [];
  }, [tasks]);

  const [showAllDone, setShowAllDone] = useState(false);

  const currentTaskUuid = timerInfo?.task_uuid;
  const currentTask = useMemo(
    () => todayTasks.find((task) => task.uuid === currentTaskUuid),
    [todayTasks, currentTaskUuid],
  );

  const handleCompleteCurrent = useCallback(
    async (task: ITask) => {
      if (task.status === "done") return;
      // 1. 标记当前任务为 done
      await markAsDone(task);
      // 2. 停止当前 timer（记录专注时长）
      await handleStopFocus();
      // 3. 拉取最新任务列表
      const latestTasks = await getTasks();
      const latestToday = (latestTasks ?? []).filter(
        (t) => t.status === "today",
      );
      // 4. 选列表里的下一个未完成 today 任务
      const finishedIdx = latestToday.findIndex((t) => t.uuid === task.uuid);
      const next =
        finishedIdx >= 0
          ? (latestToday
              .slice(finishedIdx + 1)
              .find((t) => t.status !== "done") ??
            latestToday.find((t) => t.status !== "done"))
          : latestToday.find((t) => t.status !== "done");

      if (next) {
        await handleStartFocus(next);
        setShowAllDone(false);
      } else {
        // 5. 没有下一个了，显示庆祝页
        setShowAllDone(true);
      }
    },
    [markAsDone, handleStopFocus, getTasks, handleStartFocus],
  );

  const handleExitToKanban = useCallback(async () => {
    setShowAllDone(false);
    exitSidebar();
  }, [exitSidebar]);

  const allDone = showAllDone || (!currentTask && todayTasks.length === 0);

  const initialTodayTasks = tasks?.filter(
    (task) => task.initial_status === "today",
  );

  const showProgress = !!initialTodayTasks?.length;
  const isDoneTasks = initialTodayTasks?.filter(
    (task) => task.status === "done",
  ).length;
  const progress = isDoneTasks
    ? (isDoneTasks / initialTodayTasks.length) * 100
    : 0;

  return (
    <div className="flex h-full w-[343px] flex-col gap-8">
      <div className="flex h-full justify-center gap-6">
        <div
          className={cn(
            "bg-card text-card-foreground relative flex h-full flex-1 flex-col overflow-hidden overflow-y-scroll rounded-2xl border p-5 shadow-sm",
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
              <div className="text-muted-foreground ml-1 text-xs font-normal">
                {`${todayTasks.length} tasks`}
              </div>
            </div>
            <div className="actions">
              <IconHome
                className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                onClick={async () => {
                  await handleExitToKanban();
                  if (timerInfo) {
                    await handleStopFocus();
                    getTasks();
                  }
                }}
              />
            </div>
          </div>

          {allDone ? (
            <AllDoneView
              onGoRelax={handleExitToKanban}
              onCreateTask={handleExitToKanban}
            />
          ) : (
            <>
              {showProgress && (
                <div className="text-muted-foreground mt-2 flex w-full items-center gap-4 text-xs">
                  <Progress className="h-2" value={progress} />
                  <div className="shrink-0">
                    {isDoneTasks}/{initialTodayTasks.length} Done
                  </div>
                </div>
              )}
              <div className="mt-5 flex flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto">
                {todayTasks.map((task) =>
                  task.uuid === currentTaskUuid ? (
                    <CardSimpleItem
                      key={task.uuid}
                      item={task}
                      onStartFocus={handleSwitchFocus}
                      onComplete={handleCompleteCurrent}
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
                className="mt-4 rounded-full shadow-sm"
              >
                Focus on task
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AllDoneView({
  onGoRelax,
  onCreateTask,
}: {
  onGoRelax: () => void;
  onCreateTask: () => void;
}) {
  return (
    <div className="mt-5 flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <div className="flex flex-col gap-1">
        <div className="text-foreground text-lg font-semibold">
          Woohooo!! All tasks done for the day
        </div>
        <div className="text-muted-foreground text-xs">
          Take a breather — you earned it.
        </div>
      </div>
      <Button
        size="lg"
        onClick={onGoRelax}
        className="w-full rounded-full py-6 shadow-sm"
      >
        Go Relax
      </Button>
      <button
        type="button"
        onClick={onCreateTask}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs underline-offset-4 transition-colors hover:underline"
      >
        <IconPlus className="size-3.5" />
        Create Task
      </button>
    </div>
  );
}
