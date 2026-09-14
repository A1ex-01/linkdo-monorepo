import { request } from "./base";

export type ImagePurpose = "avatars" | "collection-covers";

export const DEFAULT_FILE_BASE_URL =
  "https://a-linkkk-do.oss-cn-shanghai.aliyuncs.com";

export function createImageUploadForm(file: File, purpose: ImagePurpose) {
  const form = new FormData();
  form.append("file", file);
  form.append("purpose", purpose);
  return form;
}

export function uploadImage(file: File, purpose: ImagePurpose) {
  return request<{ path: string }>({
    url: "/api/files/upload",
    method: "post",
    data: createImageUploadForm(file, purpose),
  });
}

export function resolveFilePath(path?: string) {
  if (!path || path.startsWith("http://") || path.startsWith("https://"))
    return path;
  const base = (
    process.env.NEXT_PUBLIC_FILE_BASE_URL || DEFAULT_FILE_BASE_URL
  ).replace(/\/$/, "");
  return base ? `${base}/${path.replace(/^\//, "")}` : undefined;
}
