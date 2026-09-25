"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { useState } from "react";
import {
  getDownloadClickEndpoint,
  getDownloadTargetUrl,
} from "@/lib/macos-download";
import { ArrowRightIcon } from "@/components/icons";

type DownloadLinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> & {
  children: ReactNode;
};

export function DownloadLink({
  children,
  onClick,
  ...props
}: DownloadLinkProps) {
  const [open, setOpen] = useState(false);
  const downloadUrls = {
    macos: getDownloadTargetUrl("macos", {
      macos: process.env.NEXT_PUBLIC_MACOS_DOWNLOAD_URL,
      windows: process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL,
    }),
    windows: getDownloadTargetUrl("windows", {
      macos: process.env.NEXT_PUBLIC_MACOS_DOWNLOAD_URL,
      windows: process.env.NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL,
    }),
  };

  const reportDownloadClick = (platform: "macos" | "windows") => {
    void fetch(getDownloadClickEndpoint(process.env.NEXT_PUBLIC_API_BASE_URL), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ platform, source: window.location.pathname }),
      keepalive: true,
    }).catch(() => undefined);
  };

  return (
    <div className="relative inline-flex">
      <a
        {...props}
        href="#download-options"
        title={props.title ?? "下载 Linkdo"}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          onClick?.(event);

          if (event.defaultPrevented) {
            return;
          }
          event.preventDefault();
          setOpen((value) => !value);
        }}
      >
        {children}
      </a>
      {open && (
        <div
          id="download-options"
          role="menu"
          aria-label="选择下载版本"
          className="absolute top-[calc(100%+10px)] z-50 w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#1b1b1b] p-1.5 shadow-2xl"
        >
          <DownloadOption
            href={downloadUrls.macos}
            platform="macos"
            title="macOS"
            detail="Apple Silicon 与 Intel"
            onSelect={reportDownloadClick}
          />
          <DownloadOption
            href={downloadUrls.windows}
            platform="windows"
            title="Windows"
            detail="Windows 10 / 11（64 位）"
            onSelect={reportDownloadClick}
          />
        </div>
      )}
    </div>
  );
}

function DownloadOption({
  href,
  platform,
  title,
  detail,
  onSelect,
}: {
  href: string | null;
  platform: "macos" | "windows";
  title: string;
  detail: string;
  onSelect: (platform: "macos" | "windows") => void;
}) {
  const content = (
    <>
      <span className="grid size-9 place-items-center rounded-lg bg-white/8 text-lg text-white">
        {platform === "macos" ? "⌘" : "⊞"}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-white">{title}</span>
        <span className="mt-0.5 block truncate text-xs text-[#858585]">
          {href ? detail : "安装包暂不可用"}
        </span>
      </span>
      <span aria-hidden="true" className="text-[#858585]">
        <ArrowRightIcon className="size-4 rotate-90" />
      </span>
    </>
  );

  if (!href) {
    return (
      <span
        aria-disabled="true"
        className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-3 text-left opacity-60"
      >
        {content}
      </span>
    );
  }

  return (
    <a
      href={href}
      role="menuitem"
      onClick={() => onSelect(platform)}
      className="flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/[0.07]"
    >
      {content}
    </a>
  );
}
