// frontend/src/app/work/data-provider.tsx

"use client";
import { useFocusModeTransition } from "@/hooks/use-focus-mode-transition";
import {
  getCollection as getCollectionService,
  getTasks as getTasksService,
} from "@/services/collection";
import {
  deleteTask as deleteTaskService,
  moveTask as moveTaskService,
  updateTask,
  updateTaskStatus as updateTaskStatusService,
} from "@/services/task";
import { startTimer, stopTimer } from "@/services/timer";
import { ICollection, ITask, ITimeSession, TaskStatus } from "@/types/base";
import { open } from "@tauri-apps/plugin-shell";
import { useRequest } from "ahooks";
import { useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";

interface IDataContext {
  collection?: ICollection;
  getCollection: (collectionUuid: string) => Promise<ICollection | undefined>;
  tasks?: ITask[];
  getTasks: () => Promise<ITask[]>;
  setTasks: (tasks: ITask[]) => void;
  updateTaskStatusOptimistic: (
    taskUuid: string,
    newStatus: TaskStatus,
  ) => Promise<boolean>;
  moveTaskOptimistic: (params: {
    taskUuid: string;
    newStatus: TaskStatus;
    prevRank: string;
    nextRank: string;
    destinationIndex: number;
    sourceIndex: number;
    sourceStatus: TaskStatus;
  }) => Promise<boolean>;
  viewMode: "kanban" | "sidebar" | "capsule";
  handleToSideBar: () => void;
  enterSidebar: () => void;
  exitSidebar: () => void;
  handleStartFocus: (task: ITask) => Promise<void>;
  handleStopFocus: () => Promise<void>;
  handleSwitchFocus: (task: ITask) => Promise<void>;
  timerInfo: ITimeSession | undefined;
  setViewMode: (mode: "kanban" | "sidebar" | "capsule") => void;
  enterCapsule: () => void;
  exitCapsule: () => void;
  toNextTaskStatus: (task: ITask) => void;
  toPrevTaskStatus: (task: ITask) => void;
  markAsDone: (task: ITask) => Promise<void>;
  updateTaskTitle: (task: ITask, title: string) => Promise<boolean>;
  updateTaskContent: (task: ITask, content: string) => Promise<boolean>;
  updateTaskScheduledDate: (
    task: ITask,
    scheduledDate: string | null,
  ) => Promise<boolean>;
  deleteTask: (task: ITask) => Promise<boolean>;
  openTaskInNotion: (task: ITask) => Promise<void>;
}

const DataContext = createContext<IDataContext | null>(null);

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
};

interface DataProviderProps {
  children: React.ReactNode;
}

export const DataProvider = ({ children }: DataProviderProps) => {
  const [viewMode, setViewMode] = useState<"kanban" | "sidebar" | "capsule">(
    "kanban",
  );
  const { enterSidebar, exitSidebar, enterCapsule, exitCapsule } =
    useFocusModeTransition();

  const searchParams = useSearchParams();
  const collectionUuid = searchParams.get("uuid");

  const {
    data: tasks,
    runAsync: getTasks,
    mutate: setTasks,
  } = useRequest(
    async () => {
      const tasksRes = await getTasksService(collectionUuid!);
      if (tasksRes.success && tasksRes.data) {
        return tasksRes.data;
      } else {
        toast.error(tasksRes.message ?? "Failed to fetch tasks");
        return [];
      }
    },
    {
      refreshDeps: [collectionUuid],
    },
  );

  // Mirror the latest tasks snapshot so async callbacks (e.g. the moveTask
  // promise chain) can read fresh data without a stale closure.
  const tasksRef = useRef<ITask[] | undefined>(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const updateTaskStatusOptimistic = async (
    taskUuid: string,
    newStatus: TaskStatus,
  ) => {
    const previousTasks = tasks;
    const optimisticTasks = tasks?.map((task) =>
      task.uuid === taskUuid ? { ...task, status: newStatus } : task,
    );
    if (optimisticTasks) setTasks(optimisticTasks);

    try {
      const res = await updateTaskStatusService(taskUuid, newStatus);
      if (!res.success) {
        if (previousTasks) setTasks(previousTasks);
        toast.error(res.message ?? "Failed to update task status");
        return false;
      }
      return true;
    } catch (err) {
      if (previousTasks) setTasks(previousTasks);
      toast.error("Failed to update task status");
      return false;
    }
  };

  const moveTaskOptimistic = async (params: {
    taskUuid: string;
    newStatus: TaskStatus;
    prevRank: string;
    nextRank: string;
    destinationIndex: number;
    sourceIndex: number;
    sourceStatus: TaskStatus;
  }) => {
    const previousTasks = tasks;
    // Reorder + restate locally so the card snaps to the drop position
    // immediately. destination.index is the post-remove position inside the
    // destination status column, so we rebuild that column (and remove the
    // task from the source column when it differs) and stitch them back
    // into the global task list preserving the original column order.
    // We use a placeholder sort_order; the real one comes back from the
    // server.
    const optimisticTasks = (() => {
      if (!previousTasks) return previousTasks;
      const moving = previousTasks.find((t) => t.uuid === params.taskUuid);
      if (!moving) return previousTasks;

      const columnTasks = (status: TaskStatus) =>
        previousTasks.filter((t) => t.status === status);

      const sameColumn = params.sourceStatus === params.newStatus;
      const sourceCol = columnTasks(params.sourceStatus).filter(
        (t) => t.uuid !== params.taskUuid,
      );
      const destCol = sameColumn
        ? sourceCol
        : columnTasks(params.newStatus);
      const updatedMoving = { ...moving, status: params.newStatus };
      const insertIndex = Math.max(
        0,
        Math.min(params.destinationIndex, destCol.length),
      );
      const rebuiltDest = [
        ...destCol.slice(0, insertIndex),
        updatedMoving,
        ...destCol.slice(insertIndex),
      ];

      // Rebuild the global list keeping the original status ordering.
      const seenStatuses = new Set<TaskStatus>();
      const statusOrder: TaskStatus[] = [];
      for (const t of previousTasks) {
        if (!seenStatuses.has(t.status)) {
          seenStatuses.add(t.status);
          statusOrder.push(t.status);
        }
      }
      const rebuilt: ITask[] = [];
      for (const s of statusOrder) {
        if (sameColumn && s === params.newStatus) {
          rebuilt.push(...rebuiltDest);
        } else if (s === params.sourceStatus) {
          rebuilt.push(...sourceCol);
        } else if (s === params.newStatus) {
          rebuilt.push(...rebuiltDest);
        } else {
          rebuilt.push(...columnTasks(s));
        }
      }
      return rebuilt;
    })();

    if (optimisticTasks) setTasks(optimisticTasks);

    try {
      const res = await moveTaskService(params.taskUuid, {
        status: params.newStatus,
        prev_rank: params.prevRank,
        next_rank: params.nextRank,
      });
      if (!res.success) {
        if (previousTasks) setTasks(previousTasks);
        toast.error(res.message ?? "Failed to move task");
        return false;
      }
      // Replace the placeholder rank with the one the server returned.
      // Read the latest tasks snapshot via a ref so we don't clobber the
      // optimistic ordering with a stale closure.
      const serverRank = res.data?.sort_order;
      if (serverRank) {
        const current = tasksRef.current ?? [];
        const after = current.map((t) =>
          t.uuid === params.taskUuid ? { ...t, sort_order: serverRank } : t,
        );
        setTasks(after);
      }
      return true;
    } catch (err) {
      if (previousTasks) setTasks(previousTasks);
      toast.error("Failed to move task");
      return false;
    }
  };

  const { data: collection, runAsync: getCollection } = useRequest(
    async () => {
      const colRes = await getCollectionService(collectionUuid!);
      if (colRes.success && colRes.data) {
        return colRes.data;
      } else {
        toast.error(colRes.message ?? "Failed to fetch tasks");
      }
    },
    {
      refreshDeps: [collectionUuid],
    },
  );

  const handleToSideBar = useCallback(() => {
    setViewMode("sidebar");
    enterSidebar();
  }, [enterSidebar]);

  const handleExitSidebar = useCallback(() => {
    exitSidebar();
    setViewMode("kanban");
  }, [exitSidebar]);

  const [timerInfo, setTimerInfo] = useState<ITimeSession>();

  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  const handleStartFocus = async (task: ITask) => {
    const res = await startTimer(task.uuid);
    if (res.success) {
      setTimerInfo(res.data);
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      timerInterval.current = setInterval(() => {
        setTimerInfo((prev) => {
          if (prev) {
            return {
              ...prev,
              duration: prev.duration + 1,
            };
          }
          return prev;
        });
      }, 1000);
    }
  };
  const handleStopFocus = async () => {
    if (timerInfo) {
      const res = await stopTimer(timerInfo.task_uuid);
      if (res.success) {
        setTimerInfo(undefined);
      }
    }
  };

  const handleSwitchFocus = async (task: ITask) => {
    if (timerInfo?.task_uuid === task.uuid) return;
    await handleStopFocus();
    await handleStartFocus(task);
  };

  const toNextTaskStatus = async (task: ITask) => {
    const nextStatusMap: Record<TaskStatus, TaskStatus> = {
      backlog: "this_week",
      this_week: "today",
      today: "done",
      done: "done",
    };
    const res = await updateTaskStatusService(task.uuid, nextStatusMap[task.status]);
    if (res.success) {
      getTasks();
    }
  };

  const markAsDone = async (task: ITask) => {
    if (task.status === "done") return;
    const res = await updateTaskStatusService(task.uuid, "done");
    if (res.success) {
      getTasks();
    }
  };
  const toPrevTaskStatus = async (task: ITask) => {
    const prevStatusMap: Record<TaskStatus, TaskStatus> = {
      backlog: "backlog",
      this_week: "backlog",
      today: "this_week",
      done: "today",
    };
    const res = await updateTaskStatusService(task.uuid, prevStatusMap[task.status]);
    if (res.success) {
      getTasks();
    }
  };

  const updateTaskTitle = async (task: ITask, title: string) => {
    const trimmed = title.trim();
    if (!trimmed || trimmed === task.title) return false;
    const res = await updateTask(task.uuid, { title: trimmed });
    if (res.success) {
      await getTasks();
      return true;
    }
    return false;
  };

  const updateTaskContent = async (task: ITask, content: string) => {
    if (content === task.content) return true;
    const res = await updateTask(task.uuid, { content });
    if (res.success) {
      await getTasks();
      return true;
    }
    return false;
  };

  const updateTaskScheduledDate = async (
    task: ITask,
    scheduledDate: string | null,
  ) => {
    const res = await updateTask(task.uuid, { scheduled_date: scheduledDate });
    if (res.success) {
      await getTasks();
      return true;
    }
    return false;
  };

  const deleteTask = async (task: ITask) => {
    try {
      const res = await deleteTaskService(task.uuid);
      if (!res.success) {
        toast.error(res.error ?? "Failed to delete task");
        return false;
      }
      await getTasks();
      toast.success("Task deleted");
      return true;
    } catch {
      toast.error("Failed to delete task");
      return false;
    }
  };

  const openTaskInNotion = async (task: ITask) => {
    if (!task.notion_page_id) {
      toast.error("This task is not linked to a Notion page");
      return;
    }

    try {
      await open(
        `https://www.notion.so/${task.notion_page_id.replaceAll("-", "")}`,
      );
    } catch {
      toast.error("Failed to open Notion page");
    }
  };

  return (
    <DataContext.Provider
      value={{
        tasks,
        getTasks,
        setTasks,
        updateTaskStatusOptimistic,
        moveTaskOptimistic,
        collection,
        getCollection,
        viewMode,
        setViewMode,
        handleToSideBar,
        enterSidebar: handleToSideBar,
        exitSidebar: handleExitSidebar,
        handleStartFocus,
        timerInfo,
        handleStopFocus,
        handleSwitchFocus,
        enterCapsule,
        exitCapsule,
        toNextTaskStatus,
        toPrevTaskStatus,
        markAsDone,
        updateTaskTitle,
        updateTaskContent,
        updateTaskScheduledDate,
        deleteTask,
        openTaskInNotion,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
