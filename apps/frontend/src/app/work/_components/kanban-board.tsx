"use client";

import { useData } from "@/app/work/data-provider";
import { AddTask } from "@/components/add-task";
import AIChat from "@/components/ai-chat";
import TaskCardItem from "@/components/task-card-item";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updateTaskStatus } from "@/services/task";
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
        isDraggingOver ? "border-[#6bff8f] bg-white opacity-100" : "opacity-60",
      )}
    />
  );
};

export function KanbanBoard({}: KanbanBoardProps) {
  const { tasks, enterSidebar, handleStartFocus, getTasks } = useData();
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
    const res = await updateTaskStatus(taskUuid, newStatus);
    if (res.success) {
      getTasks();
    }
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
            const colTasks = groupedTasks[col.value];

            return (
              <Droppable key={col.value} droppableId={col.value}>
                {(provided: DroppableProvided, snapshot) => {
                  const isOver = snapshot.isDraggingOver && activeId !== null;

                  return (
                    <div
                      className={cn(
                        "relative flex h-full flex-1 flex-col overflow-hidden rounded-xl border-2 border-gray-200 p-px",

                        isOver && "",
                        col.isHighlighted && "border-primary/30 shadow-lg",
                      )}
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      <div
                        className={cn(
                          "text-atext-500 bg-background relative flex h-full flex-1 flex-col overflow-hidden rounded-xl p-4",

                          isOver && "opacity-75",
                          col.isHighlighted && "bg-secondary",
                        )}
                      >
                        <div className="text-atext-500 flex w-full shrink-0 items-center justify-between">
                          <div className="text-xl font-medium">{col.label}</div>
                          <div className="text-3xl">+</div>
                        </div>
                        <div className="relative mt-4 flex flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto">
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
                          {col.isHighlighted && (
                            <Button
                              className="bg-primary-400 mt-auto rounded-full text-white"
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
        <AIChat />
      </div>
    </DragDropContext>
  );
}
