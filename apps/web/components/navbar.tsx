"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { MenuIcon, PlusIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { DownloadLink } from "@/app/_components/download-link";

const integrations = [
  { name: "Notion", logo: "/integrations/notion.svg", ready: true },
  { name: "ClickUp", logo: "/integrations/clickup.svg", ready: true },
  { name: "Figma Comment", logo: "/integrations/figma.svg", ready: false },
] as const;

function StatusBadge({ ready }: { ready: boolean }) {
  if (ready) {
    return (
      <span className="rounded-full bg-[#55d9c6]/15 px-2 py-1 text-[10px] font-bold text-[#55d9c6]">
        已完成
      </span>
    );
  }

  return (
    <span className="rounded-full bg-gradient-to-r from-[#ef82ef] to-[#6f98e8] px-2 py-1 text-[10px] font-bold text-[#111]">
      Coming Soon
    </span>
  );
}

function IntegrationList() {
  return (
    <ul className="flex flex-col gap-0.5">
      {integrations.map((item) => (
        <li
          key={item.name}
          className="flex items-center gap-3 rounded-xl px-2.5 py-2"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.06]">
            <Image
              src={item.logo}
              alt=""
              width={18}
              height={18}
              unoptimized
              className="size-[18px] object-contain"
            />
          </span>
          <span className="min-w-0 flex-1 text-sm text-[#d8d8d8]">
            {item.name}
          </span>
          <StatusBadge ready={item.ready} />
        </li>
      ))}
    </ul>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={`size-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path
        d="m4 6 4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function IntegrationsMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => {
        if (window.matchMedia("(hover: hover)").matches) setOpen(true);
      }}
      onMouseLeave={() => {
        if (window.matchMedia("(hover: hover)").matches) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={(event) => {
          const canHover = window.matchMedia("(hover: hover)").matches;
          if (canHover && event.detail !== 0) return;
          setOpen((value) => !value);
        }}
        className={`flex items-center gap-1 text-base leading-[25.6px] transition-colors duration-300 hover:text-white ${open ? "text-white" : "text-[#858585]"}`}
      >
        Integrations
        <ChevronDownIcon open={open} />
      </button>
      {open && (
        <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3">
          <div
            id={menuId}
            className="w-[348px] rounded-2xl border border-white/10 bg-[#171717] p-2 shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
          >
            <IntegrationList />
          </div>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header
      data-site-nav
      className="site-nav fixed inset-x-0 text-foreground top-0 z-50 h-16 border-b border-white/[0.07] bg-[#111]/95 backdrop-blur-md"
    >
      <nav className="mx-auto flex h-full w-[min(1080px,calc(100%-40px))] items-center justify-between">
        <a href="#top" className="flex items-center gap-1">
          <Image src="/linkdo-dark.png" alt="" width={26} height={26} />
          <span className="font-[family-name:var(--font-clash-display)] text-[26px] font-medium leading-none">
            Linkdo
          </span>
        </a>
        <div className="hidden items-center gap-6 min-[810px]:flex">
          <a
            href="#"
            className="text-base leading-[25.6px] text-[#858585] transition-colors duration-300 hover:text-white"
          >
            MCP
            <span className="ml-2 rounded-full bg-gradient-to-r from-[#ef82ef] to-[#6f98e8] px-2 py-1 text-[10px] font-bold text-[#111]">
              Coming Soon
            </span>
          </a>
          <IntegrationsMenu />
          <ThemeToggle />
          <DownloadLink className="linkdo-button !min-h-10 !px-5 !py-2 !text-sm">
            立即获取 Linkdo
          </DownloadLink>
        </div>
        <div className="flex items-center gap-2 min-[810px]:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-label="切换导航菜单"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/[0.04]"
          >
            {open ? (
              <PlusIcon className="size-5 rotate-45" />
            ) : (
              <MenuIcon className="size-5" />
            )}
          </button>
        </div>
      </nav>
      {open && (
        <div className="border-b border-white/10 bg-[#111] px-5 pb-6 pt-3 min-[810px]:hidden">
          <div className="mx-auto flex max-w-[728px] flex-col gap-1">
            <a
              href="/mcp"
              onClick={() => setOpen(false)}
              className="rounded-xl px-4 py-3 text-lg text-[#bfbfbf] hover:bg-white/5 hover:text-white"
            >
              MCP
              <span className="ml-2 rounded-full bg-gradient-to-r from-[#ef82ef] to-[#6f98e8] px-2 py-1 text-[10px] font-bold text-[#111]">
                Coming Soon
              </span>
            </a>
            <p className="px-4 pt-3 text-xs font-medium tracking-wide text-[#858585]">
              集成
            </p>
            <IntegrationList />
            <DownloadLink className="linkdo-button mt-3">
              立即获取 Linkdo
            </DownloadLink>
          </div>
        </div>
      )}
    </header>
  );
}
