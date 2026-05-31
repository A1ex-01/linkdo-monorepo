import type { ApiResponse } from "./client-request";
import { request } from "./client-request";
import type { PermissionCode } from "@/types/rbac";

export type { ApiResponse };

export function getMyPermissions(): Promise<ApiResponse<PermissionCode[]>> {
  return request<PermissionCode[]>({
    url: "/api/v1/admin/me/permissions",
    method: "get",
  });
}
