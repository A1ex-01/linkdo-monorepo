import { request } from "./base";

export type LinkPlatform = "notion" | "clickup";

export function getLinkOAuthUrl(platform: LinkPlatform) {
  return request<{ url: string }>({ url: `/api/link/${platform}/url`, method: "get" });
}

export function exchangeLinkCode(platform: LinkPlatform, code: string, state: string) {
  return request<void>({
    url: `/api/link/${platform}/callback`,
    method: "get",
    params: { code, state },
  });
}

// Resource discovery follows ClickUp's workspace → space → folder/list tree.
export function getClickUpResources(path: string) {
  return request<Record<string, unknown>>({
    url: "/api/link/clickup/resources",
    method: "get",
    params: { path },
  });
}
