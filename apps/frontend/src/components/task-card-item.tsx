"use client";
import { useData } from "@/app/work/data-provider";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ITask } from "@/types/base";
import { formatEstimated } from "@/utils/base";
import {
  IconArrowLeft,
  IconArrowRight,
  IconBrandNotion,
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
  IconSquareCheck,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useHover } from "ahooks";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { AMarkdownEditor } from "./a-markdown-editor";
import { StopWatch } from "./timer";

interface TaskCardItemProps extends React.HTMLAttributes<HTMLDivElement> {
  item: ITask;
}

export default function TaskCardItem({ item, ...props }: TaskCardItemProps) {
  const [showContentEditor, setShowContentEditor] = useState(true);
  const [markdownContent, setMarkdownContent] = useState(`# Milkdown React Crepe

> You're scared of a world where you're needed.

This is a demo for using Crepe with **React**.`);
  console.log(
    "🐽🐽 ~ task-card-item.tsx ~ TaskCardItem ~ markdownContent:",
    markdownContent,
  );
  const wrapperRef = useRef<HTMLDivElement>(null);
  const {
    collection,
    toNextTaskStatus,
    toPrevTaskStatus,
    updateTaskTitle,
    updateTaskScheduledDate,
    deleteTask,
    openTaskInNotion,
  } = useData();
  const isHovered = useHover(wrapperRef);
  const isHover = useMemo(() => isHovered, [isHovered]);
  const isDone = useMemo(() => item.status === "done", [item.status]);

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
      className="text-atext-460 flex flex-col gap-2 rounded-lg border border-solid border-[#e6e6e6] bg-white p-3 text-sm select-none"
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
          <div className="size-4 cursor-pointer">
            <IconSquareCheck
              className={cn(
                "hover:text-atext-400 size-full text-[#808080] transition-colors",
                item.status === "done" ? "text-primary-500" : "",
              )}
            />
          </div>
        </motion.div>
        <div
          className={cn(
            "min-w-0 flex-1 truncate",
            isHover && !isEditingTitle
              ? "cursor-text hover:text-[#808080]"
              : "",
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
              className="h-6 w-full rounded-md border border-[#e5e7eb] bg-white px-2 text-sm text-[#333] shadow-sm outline-none focus:border-[#6f98e8]"
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
          <div className="flex aspect-square size-[18px] items-center justify-center rounded bg-[#6f98e8] text-xs text-white">
            {collection?.name?.slice(0, 1)}
          </div>
          <IconBrandNotion />
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
          <div className="hover:text-atext-400 size-5 cursor-pointer p-0.5 hover:rounded">
            <IconFileSmile className="size-full text-[#808080]" />
          </div>
          {item.status !== "backlog" && (
            <div
              onClick={() => toPrevTaskStatus(item)}
              className="size-5 cursor-pointer p-0.5 hover:rounded hover:bg-[#f7f8fc] hover:text-white"
            >
              <IconArrowLeft className="size-full text-[#808080]" />
            </div>
          )}
          {item.status !== "done" && (
            <div
              onClick={() => toNextTaskStatus(item)}
              className="size-5 cursor-pointer p-0.5 hover:rounded hover:bg-[#f7f8fc] hover:text-white"
            >
              <IconArrowRight className="size-full text-[#808080]" />
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Task actions"
                onClick={(e) => e.stopPropagation()}
                className="flex size-5 cursor-pointer items-center justify-center rounded p-0.5 hover:bg-[#f7f8fc]"
              >
                <IconDotsVertical className="size-full text-[#808080]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={6}
              className="w-44 bg-white p-1 text-[#4b5563]"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                disabled={!item.notion_page_id}
                onSelect={() => void openTaskInNotion(item)}
                className="gap-2 px-2 py-1.5 text-xs"
              >
                <IconExternalLink className="size-3.5" />
                Open in Notion
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  if (window.confirm("Delete this task?")) {
                    void deleteTask(item);
                  }
                }}
                className="gap-2 px-2 py-1.5 text-xs"
              >
                <IconTrash className="size-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </motion.div>
      </div>
      {/* desc */}
      <div className="flex w-full items-center justify-between gap-2 text-xs">
        <div className="text-[#808080]">{"+EST"}</div>
        <div className="text-[#808080]">
          {formatEstimated(item.actual_time)}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ScheduledDateChip
            value={item.scheduled_date}
            onChange={(next) => {
              updateTaskScheduledDate(item, next);
            }}
          />
          <span className="text-[#1c283e]">{item?.estimated_time}</span>
        </div>
      </div>

      {/* content editor */}
      {showContentEditor && (
        <div className="flex w-full items-center justify-between gap-2 text-xs">
          <AMarkdownEditor
            value={markdownContent}
            onChange={setMarkdownContent}
          />
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
  const [draft, setDraft] = useState(toInputValue(value));

  useEffect(() => {
    if (open) {
      setDraft(toInputValue(value));
    }
  }, [open, value]);

  const display = formatScheduledLabel(value);
  const hasDate = Boolean(value);
  const selectedDate = draft ? new Date(`${draft}T00:00:00`) : undefined;

  const apply = () => {
    const next = draft ? new Date(`${draft}T00:00:00`).toISOString() : null;
    if (next === value) {
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
              ? "border-primary-400/40 bg-primary-400/10 text-primary-400 hover:bg-primary-400/15"
              : "border-[#e2e8f0] text-[#808080] hover:border-[#cdd5e2] hover:text-[#1c283e]",
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
        <div className="px-3 pt-3 text-xs font-semibold text-[#1c283e]">
          Scheduled date
        </div>
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate}
          onSelect={(date) => {
            setDraft(date ? format(date, "yyyy-MM-dd") : "");
          }}
        />
        <div className="flex items-center justify-between gap-2 px-3 pb-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clear}
            disabled={!hasDate}
            className="h-7 px-2 text-[11px] text-[#808080] hover:text-[#ef4444]"
          >
            <IconX className="size-3" />
            Clear
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={apply}
            className="bg-primary-400 hover:bg-primary-400/90 h-7 rounded-md px-3 text-[11px] text-white"
          >
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function toInputValue(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
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
}: {
  item: ITask;
  className?: string;
}) {
  const { timerInfo } = useData();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isHover = useHover(wrapperRef);
  const itemClassName = "cursor-pointer hover:text-[#1c283e]";
  const mergedClassName = className ?? "bg-secondary text-[#1c283e]";
  return (
    <div
      ref={wrapperRef}
      className={`relative flex h-12 flex-col justify-center gap-2 overflow-hidden rounded-lg px-3 text-sm select-none ${mergedClassName}`}
    >
      <div className={cn("flex w-full items-center justify-between")}>
        <div className="truncate">{item.title}</div>

        <StopWatch
          seconds={timerInfo?.duration ?? 0}
          color="#f0f7ff"
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
          className="actions ml-auto flex size-full items-center justify-center gap-2 text-[#64748b]"
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
            <IconCircleCheck className="text-primary-400 size-5" />
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
  const itemClassName = "cursor-pointer hover:text-[#1c283e]";
  const mergedClassName = className ?? "bg-secondary text-[#1c283e]";
  return (
    <div
      ref={wrapperRef}
      className={`relative flex h-12 flex-col justify-center gap-2 overflow-hidden rounded-lg px-3 text-sm select-none ${mergedClassName}`}
    >
      <div className={cn("flex w-full items-center justify-between")}>
        <div className="truncate">{item.title}</div>
        <StopWatch
          seconds={timerInfo?.duration ?? 0}
          color="#f0f7ff"
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
          className="actions ml-auto flex size-full items-center justify-center gap-2 text-[#64748b]"
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
            <IconCircleCheck className="text-primary-400 size-5" />
          </div>
          <div
            className={`${itemClassName} `}
            onClick={() => {
              onAction("maximize");
            }}
          >
            <IconMaximize className="text-primary-400 size-5" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
