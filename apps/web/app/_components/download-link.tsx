"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { useState } from "react";
import { MACOS_DOWNLOAD_PATH, isMacOS } from "@/lib/macos-download";

type DownloadLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  children: ReactNode;
};

export function DownloadLink({ children, onClick, ...props }: DownloadLinkProps) {
  const [showMacOSOnlyMessage, setShowMacOSOnlyMessage] = useState(false);

  return (
    <>
      <a
        {...props}
        href={MACOS_DOWNLOAD_PATH}
        title={props.title ?? "下载 Linkdo macOS 版"}
        onClick={(event) => {
          onClick?.(event);

          if (event.defaultPrevented) {
            return;
          }

          const platform = isMacOS(navigator.userAgent)
            ? "macos"
            : "unsupported";
          const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

          if (apiBaseUrl) {
            void fetch(`${apiBaseUrl}/api/download-clicks`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ platform, source: window.location.pathname }),
              keepalive: true,
            }).catch(() => undefined);
          }

          if (platform === "macos") {
            return;
          }

          event.preventDefault();
          setShowMacOSOnlyMessage(true);
        }}
      >
        {children}
      </a>
      {showMacOSOnlyMessage && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2 rounded-full border border-white/10 bg-[#202020] px-4 py-2 text-sm text-white shadow-xl"
        >
          Linkdo 目前仅支持 macOS
        </div>
      )}
    </>
  );
}
