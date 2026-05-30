// frontend/src/services/timer.ts

import { request } from "./base";
import type { ITimeSession } from "@/types/base";

export function startTimer(taskUuid: string) {
  return request<ITimeSession>({
    url: `/api/v1/tasks/${taskUuid}/timer/start`,
    method: "post",
  });
}

export function stopTimer(taskUuid: string) {
  return request<void>({
    url: `/api/v1/tasks/${taskUuid}/timer/stop`,
    method: "post",
  });
}

export function getCurrentTimer() {
  return request<ITimeSession | null>({
    url: "/api/v1/timer/current",
    method: "get",
  });
}
