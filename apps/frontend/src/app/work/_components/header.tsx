// frontend/src/components/work/header.tsx

"use client";

import { NotionDropdown } from "@/app/work/_components/notion-dropdown";
import { useData } from "@/app/work/data-provider";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { useUserStore } from "@/stores/user";
import { IconChevronDown, IconChevronLeft } from "@tabler/icons-react";
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
          className="group/brand flex items-center gap-2 rounded-md px-2 py-1 text-[15px] font-semibold tracking-tight text-black transition-colors hover:text-black"
        >
          <IconChevronLeft />
          BACK
        </button>

        {collection?.name ? (
          <button
            type="button"
            className="group/collection flex items-center gap-1.5 rounded-md bg-white px-2 px-4 py-1 text-lg font-medium text-black/85 transition-colors hover:bg-white/5 hover:text-black"
          >
            <span className="max-w-[28ch] truncate">{collection.name}</span>
            <IconChevronDown className="size-4 text-black/40 transition-transform group-hover/collection:rotate-180" />
          </button>
        ) : null}
      </div>

      {/* Right: Quick search + Notion + Avatar */}
      <div className="flex items-center gap-3">
        <NotionDropdown className="w-full" />

        <Avatar size="default" className="ring-1 ring-white/10">
          <AvatarImage src={user?.avatar_url} className="size-9 object-cover" />
          <AvatarFallback className="bg-gradient-to-br from-[#7c9cff]/30 to-[#b07cff]/30 text-xs text-black">
            {user?.name?.slice(0, 2)?.toUpperCase() ?? "U"}
          </AvatarFallback>
          <AvatarBadge className="bg-emerald-400" />
        </Avatar>
      </div>
    </header>
  );
}
