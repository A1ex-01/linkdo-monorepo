"use client";

import { useData } from "@/app/work/data-provider";
import { AddTask } from "@/components/add-task";
import TaskCardItem from "@/components/task-card-item";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types/base";
import { toGroupedTasks } from "@/utils/base";
import {
  DragDropContext,
  Draggable,
  DragUpdate,
  Droppable,
  type DraggableProvided,
  type DroppableProvided,
  type DropResult,
} from "@hello-pangea/dnd";
import { IconCircleCheck, IconPlus } from "@tabler/icons-react";
import { useCallback, useState } from "react";

const COLUMNS: Array<{
  label: string;
  value: TaskStatus;
  isHighlighted?: boolean;
}> = [
  { label: "Backlog", value: "backlog" },
  { label: "This Week", value: "this_week" },
  { label: "Today", value: "today", isHighlighted: true },
  { label: "Done", value: "done" },
];

interface KanbanBoardProps {}

const DropZone = ({
  isVisible,
  isDraggingOver,
}: {
  isVisible: boolean;
  isDraggingOver: boolean;
}) => {
  if (!isVisible) return null;
  return (
    <div
      className={cn(
        "absolute top-0 h-[72px] w-full shrink-0 rounded-lg border-2 border-dashed border-[#515151] transition-all",
        isDraggingOver
          ? "border-[#363636] bg-[#232323] opacity-100"
          : "opacity-60",
      )}
    />
  );
};

export function KanbanBoard({}: KanbanBoardProps) {
  const { tasks, enterSidebar, handleStartFocus, moveTaskOptimistic } =
    useData();
  const groupedTasks = toGroupedTasks(tasks);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const onDragStart = useCallback((start: { draggableId: string }) => {
    setActiveId(start.draggableId);
    setOverIndex(null);
  }, []);

  const onDragUpdate = useCallback((update: DragUpdate) => {
    setOverIndex(update.destination?.index ?? null);
  }, []);

  const handleDragEnd = async (result: DropResult) => {
    setActiveId(null);
    setOverIndex(null);
    const { source, destination } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const taskUuid = result.draggableId;
    const newStatus = destination.droppableId as TaskStatus;

    // Compute the ranks of the items immediately above and below the drop
    // position in the destination column. Empty neighbours mean "no rank on
    // that side yet" and the server will treat them as virtual bounds.
    //
    // hello-pangea/dnd gives us the index in the *post-move* list, so the
    // item at destination.index in destinationTasks is the neighbour that
    // sits *below* the drop position (or the task itself if it's still
    // there). We skip the moving task itself when scanning so we get the
    // real neighbours regardless of whether source and destination live in
    // the same column.
    const destinationTasks = groupedTasks[newStatus] || [];
    const remaining = destinationTasks.filter((t) => t.uuid !== taskUuid);
    const insertAt = Math.max(0, Math.min(destination.index, remaining.length));
    const above = remaining[insertAt - 1];
    const below = remaining[insertAt];
    const prevRank = above?.sort_order ?? "";
    const nextRank = below?.sort_order ?? "";

    await moveTaskOptimistic({
      taskUuid,
      newStatus,
      prevRank,
      nextRank,
      destinationIndex: destination.index,
      sourceIndex: source.index,
      sourceStatus: source.droppableId as TaskStatus,
    });
  };

  return (
    <DragDropContext
      onDragStart={onDragStart}
      onDragUpdate={onDragUpdate}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full flex-col gap-8">
        <div className="flex h-full justify-center gap-6">
          {COLUMNS.map((col) => {
            const colTasks = groupedTasks[col.value] || [];

            return (
              <Droppable key={col.value} droppableId={col.value}>
                {(provided: DroppableProvided, snapshot) => {
                  const isOver = snapshot.isDraggingOver && activeId !== null;

                  const allTasks = tasks?.filter(
                    (task) => task.initial_status === col.value,
                  );

                  const isDoneTasks = allTasks?.filter(
                    (task) => task.status === "done",
                  );

                  const progress =
                    isDoneTasks?.length && allTasks?.length
                      ? (isDoneTasks?.length / allTasks?.length) * 100
                      : 0;

                  const showProgress =
                    allTasks &&
                    allTasks?.length > 0 &&
                    !["backlog", "done"].includes(col.value);

                  return (
                    <div
                      className={cn(
                        "relative flex h-full flex-1 flex-col overflow-hidden rounded-xl border-2 border-[#282828] p-px",

                        isOver && "",
                        col.isHighlighted &&
                          "border-3 border-[#3d3b3b] shadow-lg",
                      )}
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      <div
                        className={cn(
                          "relative flex h-full flex-1 flex-col overflow-hidden rounded-xl bg-[#181818] p-4 text-white",

                          isOver && "opacity-75",
                        )}
                      >
                        <div className="flex w-full shrink-0 items-center justify-between text-white">
                          <div className="text-xl font-medium">{col.label}</div>
                          <div className="text-atext-450 text-3xl">
                            <IconPlus className="size-5" />
                          </div>
                        </div>
                        {showProgress && (
                          <div className="text-atext-450 mt-2 flex w-full items-center gap-4 text-xs">
                            <Progress className="h-2" value={progress} />
                            <div className="shrink-0">
                              {isDoneTasks?.length}/{allTasks?.length} Done
                            </div>
                          </div>
                        )}
                        <div className="relative mt-4 flex flex-1 scrollbar-none flex-col gap-3 overflow-x-hidden overflow-y-auto">
                          {colTasks?.map((task, index) => {
                            const isActive = activeId === task.uuid;
                            const targetIndex = overIndex;
                            const showBefore =
                              isOver &&
                              (targetIndex === -1
                                ? index === colTasks.length - 1
                                : index === targetIndex);

                            return (
                              <div key={task.uuid} className="relative">
                                {showBefore && (
                                  <DropZone
                                    key={`dropzone-before-${task.uuid}`}
                                    isVisible={true}
                                    isDraggingOver={
                                      targetIndex !== -1 &&
                                      targetIndex === index
                                    }
                                  />
                                )}
                                <Draggable
                                  draggableId={task.uuid}
                                  index={index}
                                >
                                  {(dragProvided: DraggableProvided) => (
                                    <div
                                      ref={dragProvided.innerRef}
                                      {...dragProvided.draggableProps}
                                      {...dragProvided.dragHandleProps}
                                      style={{
                                        ...dragProvided.draggableProps.style,
                                      }}
                                    >
                                      <TaskCardItem
                                        item={task}
                                        style={{
                                          opacity: isActive ? 0.5 : 1,
                                        }}
                                      />
                                    </div>
                                  )}
                                </Draggable>
                              </div>
                            );
                          })}

                          {provided.placeholder}
                          <AddTask status={col.value} />
                          {colTasks?.length === 0 && (
                            <div className="text-atext-460 flex h-full w-full flex-col items-center justify-center gap-2">
                              <IconCircleCheck className="size-10" />
                              <div className="text-atext-460">All Clear</div>
                            </div>
                          )}
                          {col.isHighlighted && (
                            <Button
                              className="mt-auto rounded-full border border-[#3a3a3a] bg-[#2b2b2b] py-6! text-white"
                              size={"lg"}
                              onClick={() => {
                                enterSidebar();
                                const firstTodayTask = groupedTasks.today[0];
                                handleStartFocus(firstTodayTask);
                              }}
                            >
                              Start focus
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }}
              </Droppable>
            );
          })}
        </div>
        {/* <AIChat /> */}
      </div>
    </DragDropContext>
  );
}
