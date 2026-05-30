import { ITask, TaskStatus } from "@/types/base";
import { groupBy } from "lodash-es";

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ellipsis(text: string, maxLength: number) {
  if (!text) return "";
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + "...";
  }
  return text;
}

export function toGroupedTasks(
  tasks: ITask[] | undefined,
): Record<TaskStatus, ITask[]> {
  if (!tasks)
    return {
      backlog: [],
      this_week: [],
      today: [],
      done: [],
    };
  const grouped = groupBy(tasks, (t) => t.status);
  return {
    backlog: grouped.backlog,
    this_week: grouped.this_week,
    today: grouped.today,
    done: grouped.done,
  };
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function getGreetingMessage(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Let's crush your morning!";
  if (hour < 17) return "Let's have a productive afternoon!";
  return "Nice! Blitzing through your evening!";
}

export function formatEstimated(minutes: number): string | undefined {
  if (minutes === 0) return undefined;
  const h = Math.floor(minutes / 60);
  if (h === 0) return `${minutes}m`;
  if (h === 1) return "1hr";
  return `${h}hr`;
}
