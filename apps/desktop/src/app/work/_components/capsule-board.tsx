"use client";

import { useData } from "@/app/work/data-provider";
import { CapsuleItem } from "@/components/task-card-item";
import { useMemo } from "react";

interface CapsuleBoardProps {}

export function CapsuleBoard({}: CapsuleBoardProps) {
  const { tasks, timerInfo, exitCapsule, setViewMode } = useData();

  const currTask = useMemo(() => {
    return tasks?.find((task) => task.uuid === timerInfo?.task_uuid);
  }, [tasks, timerInfo]);

  if (!currTask) {
    return null;
  }

  return (
    <div className="flex h-full w-[343px] flex-col">
      <CapsuleItem
        item={currTask}
        onAction={async (action) => {
          if (action === "maximize") {
            const exited = await exitCapsule();
            if (exited) {
              setViewMode("sidebar");
            }
          }
        }}
      />
    </div>
  );
}
