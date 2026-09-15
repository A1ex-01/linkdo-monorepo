"use client";

import Image from "next/image";
import { useState } from "react";
import { MenuIcon, PlusIcon } from "@/components/icons";

const links = [
  ["Guides", "/help-center/home"],
  ["MCP", "/mcp"],
  ["Integrations", "#features"],
  ["Affiliates", "/partner-program"],
  ["Pricing", "#pricing"],
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header
      data-site-nav
      className="site-nav fixed inset-x-0 top-0 z-50 h-16 border-b border-white/[0.07] bg-[#111]/95 backdrop-blur-md"
    >
      <nav className="mx-auto flex h-full w-[min(1080px,calc(100%-40px))] items-center justify-between">
        <a href="#top" className="flex items-center gap-1">
          <Image
            src="/images/1F5ctkgqCFyafR7DXxkeImmLSIE.png"
            alt=""
            width={26}
            height={26}
          />
          <span className="font-[family-name:var(--font-clash-display)] text-[26px] font-medium leading-none">
            Linkdo
          </span>
        </a>
        <div className="hidden items-center gap-6 min-[810px]:flex">
          {links.map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="text-base leading-[25.6px] text-[#858585] transition-colors duration-300 hover:text-white"
            >
              {label}
              {label === "MCP" && (
                <span className="ml-2 rounded-full bg-gradient-to-r from-[#ef82ef] to-[#6f98e8] px-2 py-1 text-[10px] font-bold text-[#111]">
                  NEW
                </span>
              )}
            </a>
          ))}
          <a
            className="linkdo-button !min-h-10 !px-5 !py-2 !text-sm"
            href="#get-linkdo"
          >
            Get Linkdo
          </a>
        </div>
        <button
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] min-[810px]:hidden"
        >
          {open ? (
            <PlusIcon className="size-5 rotate-45" />
          ) : (
            <MenuIcon className="size-5" />
          )}
        </button>
      </nav>
      {open && (
        <div className="border-b border-white/10 bg-[#111] px-5 pb-6 pt-3 min-[810px]:hidden">
          <div className="mx-auto flex max-w-[728px] flex-col gap-1">
            {links.map(([label, href]) => (
              <a
                key={label}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-lg text-[#bfbfbf] hover:bg-white/5 hover:text-white"
              >
                {label}
              </a>
            ))}
            <a className="linkdo-button mt-3" href="#get-linkdo">
              Get Linkdo
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
