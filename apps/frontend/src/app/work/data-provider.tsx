// frontend/src/app/work/data-provider.tsx

"use client";
import { useFocusModeTransition } from "@/hooks/use-focus-mode-transition";
import {
  getCollection as getCollectionService,
  getTasks as getTasksService,
} from "@/services/collection";
import { updateTask, updateTaskStatus } from "@/services/task";
import { startTimer, stopTimer } from "@/services/timer";
import { ICollection, ITask, ITimeSession, TaskStatus } from "@/types/base";
import { useRequest } from "ahooks";
import { useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";

interface IDataContext {
  collection?: ICollection;
  getCollection: (collectionUuid: string) => Promise<ICollection | undefined>;
  tasks?: ITask[];
  getTasks: () => Promise<ITask[]>;
  viewMode: "kanban" | "sidebar" | "capsule";
  handleToSideBar: () => void;
  enterSidebar: () => void;
  exitSidebar: () => void;
  handleStartFocus: (task: ITask) => void;
  handleStopFocus: () => Promise<void>;
  timerInfo: ITimeSession | undefined;
  setViewMode: (mode: "kanban" | "sidebar" | "capsule") => void;
  enterCapsule: () => void;
  exitCapsule: () => void;
  toNextTaskStatus: (task: ITask) => void;
  toPrevTaskStatus: (task: ITask) => void;
  updateTaskTitle: (task: ITask, title: string) => Promise<boolean>;
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

  const { data: tasks, runAsync: getTasks } = useRequest(
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

  const toNextTaskStatus = async (task: ITask) => {
    const nextStatusMap: Record<TaskStatus, TaskStatus> = {
      backlog: "this_week",
      this_week: "today",
      today: "done",
      done: "done",
    };
    const res = await updateTaskStatus(task.uuid, nextStatusMap[task.status]);
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
    const res = await updateTaskStatus(task.uuid, prevStatusMap[task.status]);
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

  return (
    <DataContext.Provider
      value={{
        tasks,
        getTasks,
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
        enterCapsule,
        exitCapsule,
        toNextTaskStatus,
        toPrevTaskStatus,
        updateTaskTitle,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
