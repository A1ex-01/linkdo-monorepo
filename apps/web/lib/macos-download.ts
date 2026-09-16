export const MACOS_DOWNLOAD_PATH = "/download/macos";

export function isMacOS(userAgent: string) {
  return /Macintosh|Mac OS X/.test(userAgent);
}

export function getMacOSDownloadUrl(value: string | undefined) {
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
    process.env.NEXT_PUBLIC_API_BASE_URL;
  return `${baseUrl}/api/download-clicks`;
}
