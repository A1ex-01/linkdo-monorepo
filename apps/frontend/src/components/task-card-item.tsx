"use client";
import { useData } from "@/app/work/data-provider";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  toScheduledDateInput,
  toScheduledDateRequest,
} from "@/lib/scheduled-date";
import { cn } from "@/lib/utils";
import { ITask } from "@/types/base";
import { formatEstimated } from "@/utils/base";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconCalendarPlus,
  IconCircleCheck,
  IconDeviceGamepad2,
  IconDotsVertical,
  IconExternalLink,
  IconFileSmile,
  IconMaximize,
  IconMusicPause,
  IconPlayerPlay,
  IconRocket,
  IconSquareCheck,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useHover } from "ahooks";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { AMarkdownEditor } from "./a-markdown-editor";
import { AIconClickup } from "./icons/base";
import { StopWatch } from "./timer";

interface TaskCardItemProps extends React.HTMLAttributes<HTMLDivElement> {
  item: ITask;
  onStartFocus?: (item: ITask) => void;
}

export default function TaskCardItem({
  item,
  onStartFocus,
  ...props
}: TaskCardItemProps) {
  const [showContentEditor, setShowContentEditor] = useState(false);
  const [markdownContent, setMarkdownContent] = useState("");
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const {
    collection,
    toNextTaskStatus,
    toPrevTaskStatus,
    markAsDone,
    updateTaskTitle,
    updateTaskContent,
    updateTaskScheduledDate,
    deleteTask,
    openTaskInExternalApp,
  } = useData();
  const isHovered = useHover(wrapperRef);
  const isHover = useMemo(() => isHovered, [isHovered]);
  const isDone = useMemo(() => item.status === "done", [item.status]);
  const linkPlatform = item.clickup_task_id
    ? "clickup"
    : item.notion_page_id
      ? "notion"
      : undefined;

  useEffect(() => {
    if (!isHover) {
      setActionsMenuOpen(false);
    }
  }, [isHover]);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(item.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (!isEditingTitle) {
      setTitleDraft(item.title);
    }
  }, [item.title, isEditingTitle]);

  useEffect(() => {
    if (!actionsMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (
        target &&
        actionsMenuRef.current &&
        !actionsMenuRef.current.contains(target)
      ) {
        setActionsMenuOpen(false);
        setDeleteConfirming(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActionsMenuOpen(false);
        setDeleteConfirming(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [actionsMenuOpen]);

  const startEditingTitle = () => {
    if (!isHover) return;
    setTitleDraft(item.title);
    setIsEditingTitle(true);
  };

  const cancelEditingTitle = () => {
    setTitleDraft(item.title);
    setIsEditingTitle(false);
  };

  const commitTitle = async () => {
    const trimmed = titleDraft.trim();
    if (!trimmed) {
      cancelEditingTitle();
      return;
    }
    if (trimmed === item.title) {
      setIsEditingTitle(false);
      return;
    }
    const ok = await updateTaskTitle(item, trimmed);
    if (ok) {
      setIsEditingTitle(false);
    } else {
      setTitleDraft(item.title);
      setIsEditingTitle(false);
    }
  };
  return (
    <div
      ref={wrapperRef}
      className="flex flex-col gap-2 rounded-lg border border-solid border-[#363636] bg-[#262626] p-3 text-sm text-white select-none"
      {...props}
    >
      <div className="flex w-full items-center">
        {/* framer-motion width动画 */}
        <motion.div
          initial={
            isDone
              ? { width: 16, opacity: 1, marginRight: 4 }
              : { width: 0, opacity: 0, marginRight: 0 }
          }
          animate={
            isDone
              ? false
              : isHover
                ? { width: 16, opacity: 1, marginRight: 4 }
                : { width: 0, opacity: 0, marginRight: 0 }
          }
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
          }}
          className="shrink-0"
        >
          <div
            className="size-4 cursor-pointer"
            onClick={() => markAsDone(item)}
          >
            <IconSquareCheck
              className={cn(
                "hover:text-atext-400 size-full text-[#808080] transition-colors",
                item.status === "done" ? "text-[#7ba4e8]" : "",
              )}
            />
          </div>
        </motion.div>
        <div
          className={cn(
            "min-w-0 flex-1 truncate",
            isHover && !isEditingTitle ? "cursor-text" : "",
            isDone && "text-atext-460 line-through",
          )}
          onClick={startEditingTitle}
        >
          {isEditingTitle ? (
            <input
              ref={inputRef}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void commitTitle();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  cancelEditingTitle();
                }
              }}
              onBlur={() => void commitTitle()}
              onClick={(e) => e.stopPropagation()}
              className="bg-background text-atext-500 h-6 w-full rounded-md px-2 text-sm shadow-sm outline-none"
            />
          ) : (
            item.title
          )}
        </div>
        <motion.div
          className="ml-auto flex items-center"
          initial={{ x: 0, opacity: 1, pointerEvents: "auto" }}
          animate={
            isHover
              ? { x: 32, opacity: 0, pointerEvents: "none" }
              : { x: 0, opacity: 1, pointerEvents: "auto" }
          }
          transition={{ type: "spring", stiffness: 400, damping: 26 }}
        >
          <div className="flex aspect-square size-4.5 items-center justify-center rounded-sm bg-[#6f98e8] text-xs text-white">
            {collection?.name?.slice(0, 1)}
          </div>
          {linkPlatform === "notion" ? (
            <img
              src="/notion-brand-logo.svg"
              alt="Notion"
              className="-ml-1 size-4.5"
            />
          ) : linkPlatform === "clickup" ? (
            <AIconClickup
              alt="ClickUp"
              className="-ml-1 box-content size-4.5"
            />
          ) : null}
        </motion.div>
        <motion.div
          className="actions flex items-center gap-1"
          initial={{ x: 32, opacity: 0, pointerEvents: "none" }}
          animate={
            isHover
              ? { x: 0, opacity: 1, pointerEvents: "auto", width: "auto" }
              : { x: 32, opacity: 0, pointerEvents: "none", width: 0 }
          }
          transition={{ type: "spring", stiffness: 400, damping: 26 }}
        >
          {onStartFocus && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onStartFocus(item);
              }}
              title="Start focus on this task"
              className="size-5 cursor-pointer rounded-md p-0.5 text-[#7ba4e8] hover:bg-[#444444] hover:text-[#6f98e8]"
            >
              <IconRocket className="size-full" />
            </div>
          )}
          <div
            className={cn(
              "size-5 cursor-pointer rounded-md p-0.5 transition-colors",
              isDone
                ? "text-[#7ba4e8] hover:bg-[#444444]"
                : "text-atext-460 hover:bg-[#444444] hover:text-white",
            )}
            onClick={(e) => {
              e.stopPropagation();
              markAsDone(item);
            }}
            title={isDone ? "Mark as not done" : "Mark as done"}
          >
            <IconCircleCheck className="size-full" />
          </div>
          <div
            className="text-atext-460 size-5 cursor-pointer rounded-md p-0.5 hover:bg-[#444444] hover:text-white"
            onClick={() => {
              setMarkdownContent(item.content ?? "");
              setShowContentEditor(true);
            }}
          >
            <IconFileSmile className="size-full" />
          </div>
          {item.status !== "backlog" && (
            <div
              onClick={() => toPrevTaskStatus(item)}
              className="text-atext-460 size-5 cursor-pointer rounded-md p-0.5 hover:bg-[#444444] hover:text-white"
            >
              <IconArrowLeft className="size-full" />
            </div>
          )}
          {item.status !== "done" && (
            <div
              onClick={() => toNextTaskStatus(item)}
              className="text-atext-460 size-5 cursor-pointer rounded-md p-0.5 hover:bg-[#444444] hover:text-white"
            >
              <IconArrowRight className="size-full" />
            </div>
          )}
          <div ref={actionsMenuRef} className="relative">
            <button
              type="button"
              aria-label="Task actions"
              aria-haspopup="menu"
              aria-expanded={actionsMenuOpen}
              onClick={(e) => {
                e.stopPropagation();
                setActionsMenuOpen((prev) => {
                  const next = !prev;
                  if (!next) setDeleteConfirming(false);
                  return next;
                });
              }}
              className="text-atext-460 flex size-5 cursor-pointer items-center justify-center rounded-md p-0.5 hover:bg-[#444444]"
            >
              <IconDotsVertical className="size-full" />
            </button>
            {actionsMenuOpen && (
              <div
                role="menu"
                onClick={(e) => e.stopPropagation()}
                className="bg-popover text-popover-foreground ring-foreground/10 absolute top-full right-full z-50 mr-1.5 w-44 overflow-hidden rounded-lg p-1 shadow-md ring-1"
              >
                <button
                  type="button"
                  role="menuitem"
                  disabled={!linkPlatform}
                  onClick={() => {
                    setActionsMenuOpen(false);
                    setDeleteConfirming(false);
                    openTaskInExternalApp(item);
                  }}
                  className={cn(
                    "hover:bg-accent relative flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-white outline-hidden select-none disabled:pointer-events-none disabled:opacity-50",
                  )}
                >
                  <IconExternalLink className="size-3.5" />
                  Open in {linkPlatform === "clickup" ? "ClickUp" : "Notion"}
                </button>
                <div className="bg-border -mx-1 my-1 h-px" />
                {deleteConfirming ? (
                  <div
                    className="flex items-center gap-1 px-1 py-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      autoFocus
                      onClick={(e) => {
                        e.preventDefault();
                        deleteTask(item);
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90 flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-sm px-2 py-1 text-xs font-medium transition-colors"
                    >
                      <IconTrash className="size-3.5" />
                      Confirm delete
                    </button>
                    <button
                      type="button"
                      aria-label="Cancel delete"
                      onClick={(e) => {
                        e.preventDefault();
                        setDeleteConfirming(false);
                      }}
                      className="text-atext-460 hover:bg-accent hover:text-foreground flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-sm transition-colors"
                    >
                      <IconX className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => setDeleteConfirming(true)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive relative flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs outline-hidden select-none"
                  >
                    <IconTrash className="size-3.5" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
      {/* desc */}
      {showContentEditor ? null : (
        <div className="flex w-full items-center justify-between gap-2 text-xs">
          <div className="text-atext-460">{"+EST"}</div>
          <div className="text-atext-460">
            {formatEstimated(item.actual_time)}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ScheduledDateChip
              value={item.scheduled_date}
              onChange={(next) => {
                updateTaskScheduledDate(item, next);
              }}
            />
            <span className="text-atext-460">
              {formatEstimated(item.estimated_time)}
            </span>
          </div>
        </div>
      )}

      {/* content editor */}
      {showContentEditor && (
        <div className="flex w-full cursor-auto flex-col items-center justify-between gap-2 overflow-hidden rounded-[4px] border border-solid border-[#363636] text-xs">
          <AMarkdownEditor
            value={markdownContent}
            onChange={setMarkdownContent}
          />
          <div className="flex w-full items-center justify-end gap-2 px-3 py-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isSavingContent}
              onClick={() => {
                setMarkdownContent(item.content ?? "");
                setShowContentEditor(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              disabled={isSavingContent}
              onClick={async () => {
                setIsSavingContent(true);
                try {
                  const ok = await updateTaskContent(item, markdownContent);
                  if (ok) {
                    setShowContentEditor(false);
                  }
                } finally {
                  setIsSavingContent(false);
                }
              }}
            >
              {isSavingContent ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduledDateChip({
  value,
  onChange,
}: {
  value?: string;
  onChange: (next: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(toScheduledDateInput(value));

  useEffect(() => {
    if (open) {
      setDraft(toScheduledDateInput(value));
    }
  }, [open, value]);

  const display = formatScheduledLabel(value);
  const hasDate = Boolean(value);
  const selectedDate = draft
    ? new Date(`${draft.slice(0, 10)}T00:00:00`)
    : undefined;

  const apply = () => {
    const next = draft ? toScheduledDateRequest(draft) : null;
    if (draft === toScheduledDateInput(value)) {
      setOpen(false);
      return;
    }
    onChange(next);
    setOpen(false);
  };

  const clear = () => {
    onChange(null);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
          }}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
            hasDate
              ? "text-atext-500 border-[#363636] bg-[#363636]"
              : "text-atext-460 border-[#363636]",
          )}
        >
          {hasDate ? (
            <IconCalendar className="size-3" />
          ) : (
            <IconCalendarPlus className="size-3" />
          )}
          <span>{display}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-auto p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-atext-460 px-3 pt-3 text-xs font-semibold">
          Scheduled date
        </div>
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate}
          onSelect={(date) => {
            setDraft(
              date
                ? `${format(date, "yyyy-MM-dd")}T${draft.slice(11) || "00:00:00"}`
                : "",
            );
          }}
        />
        <div className="px-3 pb-3">
          <Input
            type="datetime-local"
            step="1"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="border border-[#363636] bg-[#1c1c1c] text-white"
          />
        </div>
        <div className="flex items-center justify-between gap-2 px-3 pb-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clear}
            disabled={!hasDate}
            className="text-atext-460 h-7 px-2 text-[11px] hover:text-[#ef4444]"
          >
            <IconX className="size-3" />
            Clear
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={apply}
            className="bg-primary h-7 rounded-md px-3 text-[11px] text-white"
          >
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function formatScheduledLabel(value?: string): string {
  if (!value) return "Set date";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Set date";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) return `In ${diffDays}d`;
  if (diffDays < -1 && diffDays > -7) return `${Math.abs(diffDays)}d ago`;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}-${dd}`;
}

export function CardSimpleItem({
  item,
  className,
  onStartFocus,
  onComplete,
}: {
  item: ITask;
  className?: string;
  onStartFocus?: (item: ITask) => void;
  onComplete?: (item: ITask) => void;
}) {
  const { timerInfo } = useData();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isHover = useHover(wrapperRef);
  const isDone = useMemo(() => item.status === "done", [item.status]);
  const itemClassName = "cursor-pointer text-atext-460 hover:text-atext-500";
  const mergedClassName =
    className ?? "bg-card text-atext-500 border border-[#363636]";

  return (
    <div
      ref={wrapperRef}
      className={`relative flex h-12 flex-col justify-center gap-2 overflow-hidden rounded-lg px-3 text-sm select-none ${mergedClassName}`}
    >
      <div className={cn("flex w-full items-center justify-between")}>
        <div
          className={cn("truncate", isDone && "text-atext-460 line-through")}
        >
          {item.title}
        </div>

        <StopWatch
          seconds={timerInfo?.duration ?? 0}
          color="#2b2b2b"
          fontSize={16}
          onTick={() => {}}
        />
      </div>
      <motion.div
        className="absolute inset-0 bg-inherit"
        initial={{ opacity: 0, x: 32, pointerEvents: "none" }}
        animate={
          isHover
            ? { opacity: 1, x: 0, pointerEvents: "auto" }
            : { opacity: 0, x: 32, pointerEvents: "none" }
        }
        transition={{ type: "spring", stiffness: 400, damping: 26 }}
      >
        <div
          data-tauri-drag-region
          className="actions text-atext-460 ml-auto flex size-full items-center justify-center gap-2"
        >
          {onStartFocus && (
            <div
              className="cursor-pointer text-[#7ba4e8] hover:text-[#6f98e8]"
              onClick={(e) => {
                e.stopPropagation();
                onStartFocus(item);
              }}
              title="Switch focus to another task"
            >
              <IconRocket className="size-5" />
            </div>
          )}
          <div className={`${itemClassName} `} onClick={() => {}}>
            <IconDeviceGamepad2 className="size-5" />
          </div>
          <div className={`${itemClassName} `} onClick={() => {}}>
            <IconFileSmile className="size-5" />
          </div>
          <div className={`${itemClassName} `} onClick={() => {}}>
            <IconMusicPause className="size-5" />
          </div>
          <div className={`${itemClassName} `} onClick={() => {}}>
            <IconPlayerPlay className="size-5" />
          </div>
          <div
            className={`${itemClassName} `}
            onClick={() => {
              if (isDone) return;
              onComplete?.(item);
            }}
            title={isDone ? "Already done" : "Mark as done"}
          >
            <IconCircleCheck
              className={cn(
                "size-5 transition-colors",
                isDone ? "text-atext-460" : "text-[#6f98e8]",
              )}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function CapsuleItem({
  item,
  className,
  onAction,
}: {
  item: ITask;
  className?: string;
  onAction: (action: "maximize" | "minimize" | "close") => void;
}) {
  const { timerInfo } = useData();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isHover = useHover(wrapperRef);
  const isDone = useMemo(() => item.status === "done", [item.status]);
  const itemClassName = "cursor-pointer text-atext-460 hover:text-atext-500";
  const mergedClassName =
    className ?? "bg-card text-atext-500 border border-[#363636]";
  return (
    <div
      ref={wrapperRef}
      className={`relative flex h-12 flex-col justify-center gap-2 overflow-hidden rounded-lg px-3 text-sm select-none ${mergedClassName}`}
    >
      <div className={cn("flex w-full items-center justify-between")}>
        <div
          className={cn("truncate", isDone && "text-atext-460 line-through")}
        >
          {item.title}
        </div>
        <StopWatch
          seconds={timerInfo?.duration ?? 0}
          color="#2b2b2b"
          fontSize={16}
          onTick={() => {}}
        />
      </div>
      <motion.div
        className="absolute inset-0 bg-inherit"
        initial={{ opacity: 0, x: 32, pointerEvents: "none" }}
        animate={
          isHover
            ? { opacity: 1, x: 0, pointerEvents: "auto" }
            : { opacity: 0, x: 32, pointerEvents: "none" }
        }
        transition={{ type: "spring", stiffness: 400, damping: 26 }}
      >
        <div
          data-tauri-drag-region
          className="actions text-atext-460 ml-auto flex size-full items-center justify-center gap-2"
        >
          <div className={`${itemClassName} `} onClick={() => {}}>
            <IconDeviceGamepad2 className="size-5" />
          </div>
          <div className={`${itemClassName} `} onClick={() => {}}>
            <IconFileSmile className="size-5" />
          </div>
          <div className={`${itemClassName} `} onClick={() => {}}>
            <IconMusicPause className="size-5" />
          </div>
          <div className={`${itemClassName} `} onClick={() => {}}>
            <IconPlayerPlay className="size-5" />
          </div>
          <div className={`${itemClassName} `} onClick={() => {}}>
            <IconCircleCheck className="size-5 text-[#6f98e8]" />
          </div>
          <div
            className={`${itemClassName} `}
            onClick={() => {
              onAction("maximize");
            }}
          >
            <IconMaximize className="size-5 text-[#6f98e8]" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
