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
