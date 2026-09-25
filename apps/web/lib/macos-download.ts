const DEFAULT_API_BASE_URL = "https://api.a1ex.online";

export type DownloadPlatform = "macos" | "windows";

export function isMacOS(userAgent: string) {
  return /Macintosh|Mac OS X/.test(userAgent);
}

export function getMacOSDownloadUrl(value: string | undefined) {
  return getSecureDownloadUrl(value);
}

export function getWindowsDownloadUrl(value: string | undefined) {
  return getSecureDownloadUrl(value);
}

export function getDownloadTargetUrl(
  platform: DownloadPlatform,
  urls: { macos: string | undefined; windows: string | undefined },
) {
  return platform === "macos"
    ? getMacOSDownloadUrl(urls.macos)
    : getWindowsDownloadUrl(urls.windows);
}

function getSecureDownloadUrl(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function getDownloadClickEndpoint(apiBaseUrl: string | undefined) {
  const baseUrl =
    apiBaseUrl?.trim().replace(/\/+$/, "") ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "") ||
    DEFAULT_API_BASE_URL;
  return `${baseUrl}/api/download-clicks`;
}
