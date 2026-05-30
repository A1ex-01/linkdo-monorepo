import type { ApiResponse, ICollection, ITask } from "./types.js";

const BASE_URL = process.env.LINKDO_API_BASE_URL ?? "http://localhost:8080";

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body,
    });
  } catch (err) {
    return { success: false, error: `Network error: ${String(err)}` };
  }

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    return { success: false, error: `HTTP ${res.status}: ${text}` };
  }

  try {
    const data = (await res.json()) as ApiResponse<T>;
    return data;
  } catch {
    return { success: false, error: "Failed to parse response JSON" };
  }
}

// Collections

export async function getCollections(
  token?: string,
  archived = false
): Promise<ApiResponse<ICollection[]>> {
  return request<ICollection[]>("/api/v1/collections", {}, token);
}

// Tasks

export async function getTasksByCollection(
  collectionUuid: string,
  token?: string
): Promise<ApiResponse<ITask[]>> {
  return request<ITask[]>(`/api/v1/collections/${collectionUuid}/tasks`, {}, token);
}

export async function createTask(
  collectionUuid: string,
  data: { title: string; estimated_time?: number; status?: string },
  token?: string
): Promise<ApiResponse<ITask>> {
  return request<ITask>(`/api/v1/collections/${collectionUuid}/tasks`, {
    method: "POST",
    body: JSON.stringify(data),
  }, token);
}

export async function updateTask(
  taskUuid: string,
  data: { title?: string; estimated_time?: number },
  token?: string
): Promise<ApiResponse<void>> {
  return request<void>(`/api/v1/tasks/${taskUuid}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }, token);
}

export async function updateTaskStatus(
  taskUuid: string,
  status: string,
  token?: string
): Promise<ApiResponse<void>> {
  return request<void>(`/api/v1/tasks/${taskUuid}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }, token);
}

export async function deleteTask(
  taskUuid: string,
  token?: string
): Promise<ApiResponse<void>> {
  return request<void>(`/api/v1/tasks/${taskUuid}`, {
    method: "DELETE",
  }, token);
}
