// desktop/src/services/timer.ts

import type { ITimeSession } from "@/types/base";
import { request } from "./base";

export function startTimer(taskUuid: string) {
  return request<ITimeSession>({
    url: `/api/tasks/${taskUuid}/timer/start`,
    method: "post",
  });
}

export function stopTimer(taskUuid: string) {
  return request<void>({
    url: `/api/tasks/${taskUuid}/timer/stop`,
    method: "post",
  });
}

export function getCurrentTimer() {
  return request<ITimeSession | null>({
    url: "/api/timer/current",
    method: "get",
  });
}
