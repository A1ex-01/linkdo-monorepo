import { useData } from "@/app/work/data-provider";
import { buildTaskLinkTargets, splitTaskLinkTarget } from "@/lib/link-targets";
import { toScheduledDateRequest } from "@/lib/scheduled-date";
import { getEstimatedMinutes, type TaskTimerMode } from "@/lib/task-timer-mode";
import { cn } from "@/lib/utils";
import { useCommonStore } from "@/stores/common";
import { TaskStatus } from "@/types/base";
import { IconCalendar, IconPlus, IconX } from "@tabler/icons-react";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Field } from "./ui/field";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
interface IProps {
  className?: string;
  status: TaskStatus;
}

interface IAddTaskForm {
  title: string;
  timer_mode: TaskTimerMode;
  estimated_time: string;
  link_target: string;
  scheduled_date: string;
}

export function AddTask({ className, status }: IProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");
  const { currCollectionNotionDbs, currCollectionClickUpLists } =
    useCommonStore();
  const { createTaskOptimistic } = useData();
  const linkTargets = useMemo(
    () =>
      buildTaskLinkTargets(currCollectionNotionDbs, currCollectionClickUpLists),
    [currCollectionClickUpLists, currCollectionNotionDbs],
  );

  const { register, handleSubmit, control, watch } = useForm<IAddTaskForm>({
    defaultValues: {
      timer_mode: "countdown",
      estimated_time: "00:30",
      link_target: "none",
      scheduled_date: `${today}T00:00:00`,
    },
  });
  const onSubmit: SubmitHandler<IAddTaskForm> = async (data) => {
    if (data.timer_mode === "countdown" && !data.estimated_time) {
      toast.error("Please set an expected duration for the countdown");
      return;
    }

    const target = splitTaskLinkTarget(data.link_target);
    const params = {
      title: data.title,
      estimated_time: getEstimatedMinutes(data.timer_mode, data.estimated_time),
      status: status,
      scheduled_date: data.scheduled_date
        ? toScheduledDateRequest(data.scheduled_date)
        : undefined,
      content: "-",
      notion_database_uuid:
        target?.platform === "notion" ? target.uuid : undefined,
      clickup_list_uuid:
        target?.platform === "clickup" ? target.uuid : undefined,
    };
    const creation = createTaskOptimistic(params);
    setIsOpen(false);

    if (await creation) {
      toast.success("Task created successfully");
    } else {
      toast.error("Failed to create task");
    }
  };
  const timerMode = watch("timer_mode");

  return (
    <div className={cn("", className)}>
      <Button
        variant="ghost"
        className="text-muted-foreground hover:text-foreground flex w-full justify-start py-2 text-left font-bold hover:bg-transparent! hover:opacity-80"
        onClick={() => setIsOpen(!isOpen)}
      >
        {!isOpen ? (
          <>
            <IconPlus />
            <span>ADD TASK</span>
          </>
        ) : (
          <>
            <IconX />
            <span>CANCEL</span>
          </>
        )}
      </Button>
      {isOpen && (
        <div>
          <div className="border-border bg-card text-card-foreground rounded-xl border p-3">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex gap-2">
                <Input
                  {...register("title", { required: true })}
                  placeholder="What do you need to do?"
                  className="bg-background"
                />
                <Controller
                  name="timer_mode"
                  control={control}
                  render={({ field }) => (
                    <div
                      role="radiogroup"
                      aria-label="计时模式"
                      className="border-border bg-muted flex shrink-0 rounded-lg border p-0.5"
                    >
                      {(
                        [
                          ["countdown", "倒计时"],
                          ["stopwatch", "正计时"],
                        ] as const
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={field.value === value}
                          onClick={() => field.onChange(value)}
                          className={cn(
                            "focus-visible:ring-ring rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
                            field.value === value
                              ? "bg-background text-foreground shadow-xs"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>
              <div className="mt-2 flex gap-2">
                <Controller
                  name="scheduled_date"
                  control={control}
                  render={({ field }) => {
                    const selectedDate = field.value
                      ? new Date(`${field.value.slice(0, 10)}T00:00:00`)
                      : undefined;

                    return (
                      <Popover
                        open={isDatePickerOpen}
                        onOpenChange={setIsDatePickerOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            data-empty={!field.value}
                            className="data-[empty=true]:text-muted-foreground flex-1 justify-between text-left font-normal"
                          >
                            {selectedDate ? (
                              format(selectedDate, "yyyy-MM-dd")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <IconCalendar data-icon="inline-end" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            defaultMonth={selectedDate}
                            onSelect={(date) => {
                              field.onChange(
                                date
                                  ? `${format(date, "yyyy-MM-dd")}T${field.value.slice(11) || "00:00:00"}`
                                  : "",
                              );
                              setIsDatePickerOpen(false);
                            }}
                          />
                          <Input
                            type="datetime-local"
                            step="1"
                            value={field.value}
                            onChange={field.onChange}
                            className="mt-2"
                          />
                        </PopoverContent>
                      </Popover>
                    );
                  }}
                />

                {timerMode === "countdown" && (
                  <Input
                    type="time"
                    aria-label="Expected duration"
                    className="w-max shrink-0"
                    {...register("estimated_time")}
                  />
                )}
              </div>
              <div className="mt-4 flex items-center gap-4">
                <Controller
                  name="link_target"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field
                      orientation="responsive"
                      data-invalid={fieldState.invalid}
                      className="flex-1"
                    >
                      <Select
                        name={field.name}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          aria-invalid={fieldState.invalid}
                          className="min-w-[120px]"
                        >
                          <SelectValue placeholder="Select target" />
                        </SelectTrigger>
                        <SelectContent position="item-aligned">
                          <SelectItem value="none">No linked app</SelectItem>
                          {linkTargets.map((target) => (
                            <SelectItem key={target.value} value={target.value}>
                              {target.platform === "notion"
                                ? "Notion"
                                : "ClickUp"}{" "}
                              / {target.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />

                <Button
                  type="submit"
                  variant="default"
                  className="rounded-full px-4"
                >
                  Confirm
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
