// frontend/src/components/work/header.tsx

"use client";

import { NotionDropdown } from "@/app/work/_components/notion-dropdown";
import { useData } from "@/app/work/data-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserStore } from "@/stores/user";
import {
  IconChevronDown,
  IconChevronLeft,
  IconSearch,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export function WorkHeader() {
  const router = useRouter();
  const { collection } = useData();
  const { user } = useUserStore();

  return (
    <header
      data-tauri-drag-region
      className="text-atext-500 sticky top-0 z-30 flex h-14 w-screen items-center justify-between px-5"
    >
      {/* Left: Brand + Collection */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.push("/home")}
          className="group/brand flex items-center gap-1 rounded-md px-2 py-1 text-[15px] font-semibold tracking-tight text-[#858585] transition-colors hover:text-[#858585]"
        >
          <IconChevronLeft />
          BACK
        </button>

        {collection?.name ? (
          <button
            type="button"
            className="group/collection flex items-center gap-1.5 rounded-md bg-[#181818] px-4 py-1 text-lg font-medium text-white transition-colors"
          >
            <span className="max-w-[28ch] truncate">{collection.name}</span>
            <IconChevronDown className="size-4 text-[#858585] transition-transform group-hover/collection:rotate-180" />
          </button>
        ) : null}
        <div className="text-atext-460 text-sm">
          This list has 6 pending tasks, Est:1hr
        </div>
      </div>

      {/* Right: Quick search + Notion + Avatar */}
      <div className="flex items-center gap-3">
        <NotionDropdown className="w-full" />

        <div className="text-atext-460 flex items-center gap-4 rounded-xs bg-[#181818] px-4 py-2">
          <IconSearch />
          <Avatar size="default" className="ring-1 ring-white/10">
            <AvatarImage
              src={user?.avatar_url}
              className="size-9 object-cover"
            />
            <AvatarFallback className="bg-[#2f2f2f] text-xs text-white">
              {user?.name?.slice(0, 2)?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <IconChevronDown className="-ml-3 size-4" />
        </div>
      </div>
    </header>
  );
}
