import { request } from "./client-request";
import type { ApiResponse } from "./client-request";
import { getToken } from "./client-request";

export { request };
export type { ApiResponse, getToken };

export interface MeResponse {
  uuid: string;
  notion_user_id: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export function getMe(): Promise<ApiResponse<MeResponse>> {
  return request<MeResponse>({
    url: "/api/v1/auth/me",
    method: "get",
  });
}

export function logout(): Promise<ApiResponse<void>> {
  return request<void>({
    url: "/api/v1/auth/logout",
    method: "post",
  });
}
