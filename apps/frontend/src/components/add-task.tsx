import { useData } from "@/app/work/data-provider";
import { buildTaskLinkTargets, splitTaskLinkTarget } from "@/lib/link-targets";
import { toScheduledDateRequest } from "@/lib/scheduled-date";
import { cn } from "@/lib/utils";
import { createTask } from "@/services/task";
import { useCommonStore } from "@/stores/common";
import { TaskStatus } from "@/types/base";
import { IconCalendar, IconPlus, IconX } from "@tabler/icons-react";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
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
  estimated_time: string;
  link_target: string;
  scheduled_date: string;
}

export function AddTask({ className, status }: IProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const { currCollectionNotionDbs, currCollectionClickUpLists } =
    useCommonStore();
  const { collection, getTasks } = useData();
  const linkTargets = useMemo(
    () =>
      buildTaskLinkTargets(currCollectionNotionDbs, currCollectionClickUpLists),
    [currCollectionClickUpLists, currCollectionNotionDbs],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
    watch,
  } = useForm<IAddTaskForm>({
    defaultValues: {
      estimated_time: "00:30",
      link_target: "",
      scheduled_date: "",
    },
  });
  const selectedTarget = watch("link_target");

  useEffect(() => {
    if (!selectedTarget && linkTargets[0]) {
      setValue("link_target", linkTargets[0].value);
    }
  }, [linkTargets, selectedTarget, setValue]);

  const onSubmit: SubmitHandler<IAddTaskForm> = async (data) => {
    const target = splitTaskLinkTarget(data.link_target);
    if (!target) {
      toast.error("Please select a Notion database or ClickUp list");
      return;
    }
    const params = {
      title: data.title,
      estimated_time:
        parseInt(data.estimated_time.split(":")[0]) * 60 +
        parseInt(data.estimated_time.split(":")[1]),
      status: status,
      scheduled_date: data.scheduled_date
        ? toScheduledDateRequest(data.scheduled_date)
        : undefined,
      content: "-",
      notion_database_uuid:
        target.platform === "notion" ? target.uuid : undefined,
      clickup_list_uuid: target.platform === "clickup" ? target.uuid : undefined,
    };
    // 新建任务
    const res = await createTask(collection?.uuid ?? "", params);
    if (res.success) {
      toast.success("Task created successfully");
      getTasks();
      setIsOpen(false);
    } else {
      toast.error(res.message ?? "Failed to create task");
    }
  };
  return (
    <div className={cn("", className)}>
      <Button
        variant="ghost"
        className="text-atext-460 hover:text-atext-450 flex w-full justify-start py-2 text-left font-bold hover:bg-transparent! hover:opacity-80"
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
          <div className="rounded-xl border border-[#363636] bg-[#262626] p-3 text-white">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex gap-2">
                <Input
                  {...register("title", { required: true })}
                  placeholder="What do you need to do?"
                  className="border border-[#363636] bg-[#1c1c1c] text-white placeholder:text-[#808080]"
                />
                <Input
                  type="time"
                  className="w-max shrink-0 border border-[#363636] bg-[#1c1c1c] text-white"
                  {...register("estimated_time", { required: true })}
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
                            className="w-full justify-between border border-[#363636] bg-[#1c1c1c] text-left font-normal text-white data-[empty=true]:text-[#808080]"
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
                            className="mt-2 border border-[#363636] bg-[#1c1c1c] text-white"
                          />
                        </PopoverContent>
                      </Popover>
                    );
                  }}
                />
              </div>
              {/* errors will return when field validation fails  */}
              {errors.estimated_time && (
                <span className="mt-1 block text-xs text-[#ef4444]">
                  This field is required
                </span>
              )}
              <div className="mt-4 flex items-center gap-4">
                <Controller
                  name="link_target"
                  control={control}
                  rules={{ required: true }}
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
                          className="min-w-[120px] border border-[#363636] bg-[#1c1c1c] text-white data-[placeholder]:text-[#808080]"
                        >
                          <SelectValue placeholder="Select target" />
                        </SelectTrigger>
                        <SelectContent
                          position="item-aligned"
                          className="border-[#363636] bg-[#262626] text-white"
                        >
                          {linkTargets.map((target) => (
                            <SelectItem
                              key={target.value}
                              value={target.value}
                              className="text-white focus:bg-[#363636] focus:text-white"
                            >
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
                  className="rounded-full bg-[#6f98e8] px-4 text-white hover:bg-[#5a86d8]"
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
