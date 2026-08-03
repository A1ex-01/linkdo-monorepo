import { useData } from "@/app/work/data-provider";
import { cn } from "@/lib/utils";
import { createTask } from "@/services/task";
import { useCommonStore } from "@/stores/common";
import { TaskStatus } from "@/types/base";
import { IconCalendar, IconPlus, IconX } from "@tabler/icons-react";
import { format } from "date-fns";
import { useState } from "react";
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
  notion_database_uuid: string;
  scheduled_date: string;
}

export function AddTask({ className, status }: IProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const { currCollectionNotionDbs } = useCommonStore();
  const { collection, getTasks } = useData();

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<IAddTaskForm>({
    defaultValues: {
      estimated_time: "00:30",
      notion_database_uuid: currCollectionNotionDbs[0]?.uuid || "",
      scheduled_date: "",
    },
  });
  const onSubmit: SubmitHandler<IAddTaskForm> = async (data) => {
    const params = {
      ...data,
      estimated_time:
        parseInt(data.estimated_time.split(":")[0]) * 60 +
        parseInt(data.estimated_time.split(":")[1]),
      status: status,
      scheduled_date: data.scheduled_date
        ? new Date(`${data.scheduled_date}T00:00:00`).toISOString()
        : undefined,
      content: "-",
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
        className="text-atext-450 hover:text-atext-450 flex w-full justify-start py-2 text-left font-bold hover:bg-transparent! hover:opacity-80"
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
          <div className="border-divider/50 rounded-xl border bg-white p-3">
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="flex gap-2">
                <Input
                  {...register("title", { required: true })}
                  placeholder="What do you need to do?"
                  className="border-divider border"
                />
                <Input
                  type="time"
                  className="border-divider w-max shrink-0 border"
                  {...register("estimated_time", { required: true })}
                />
              </div>
              <div className="mt-2 flex gap-2">
                <Controller
                  name="scheduled_date"
                  control={control}
                  render={({ field }) => {
                    const selectedDate = field.value
                      ? new Date(`${field.value}T00:00:00`)
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
                            className="border-divider data-[empty=true]:text-muted-foreground w-full justify-between border text-left font-normal"
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
                                date ? format(date, "yyyy-MM-dd") : "",
                              );
                              setIsDatePickerOpen(false);
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    );
                  }}
                />
              </div>
              {/* errors will return when field validation fails  */}
              {errors.estimated_time && <span>This field is required</span>}
              <div className="mt-4 flex gap-4">
                <Controller
                  name="notion_database_uuid"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field
                      orientation="responsive"
                      data-invalid={fieldState.invalid}
                    >
                      <Select
                        name={field.name}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          aria-invalid={fieldState.invalid}
                          className="border-divider min-w-[120px] border"
                        >
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent
                          position="item-aligned"
                          className="text-atext-500"
                        >
                          {currCollectionNotionDbs.map((db) => (
                            <SelectItem
                              key={db.uuid}
                              value={db.uuid}
                              className="text-atext-450"
                            >
                              {db.name}
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
                  className="bg-primary-400 rounded-full px-4 text-white"
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
