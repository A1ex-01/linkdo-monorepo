import { NextResponse } from "next/server";
import { getWindowsDownloadUrl } from "@/lib/macos-download";

export function GET() {
  const downloadUrl = getWindowsDownloadUrl(
    process.env.LINKDO_WINDOWS_DOWNLOAD_URL,
  );

  if (!downloadUrl) {
    return new NextResponse(
      "Windows 安装包暂时不可用，请稍后再试。",
      {
        status: 503,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store",
        },
      },
    );
  }

  return NextResponse.redirect(downloadUrl);
}
