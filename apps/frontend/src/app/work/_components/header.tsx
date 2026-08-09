// frontend/src/components/work/header.tsx

"use client";

import { NotionDropdown } from "@/app/work/_components/notion-dropdown";
import { useData } from "@/app/work/data-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TOKEN_KEY } from "@/config";
import { logout } from "@/services/base";
import { useUserStore } from "@/stores/user";
import {
  IconChevronDown,
  IconChevronLeft,
  IconLogout,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function WorkHeader() {
  const router = useRouter();
  const { collection } = useData();
  const { user, clearUser } = useUserStore();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      // 出错也继续走本地退出流程
      console.error("Logout request failed:", err);
    } finally {
      try {
        localStorage.removeItem(TOKEN_KEY);
      } catch {
        // ignore
      }
      clearUser();
      toast.success("Logged out");
      router.replace("/login");
    }
  };

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

      {/* Right: Notion + Avatar dropdown */}
      <div className="flex items-center gap-3">
        <NotionDropdown className="w-full" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild data-tauri-drag-region="false">
            <button
              type="button"
              className="text-atext-460 flex cursor-pointer items-center gap-2 rounded-xs bg-[#181818] px-3 py-1.5 transition-colors hover:bg-[#222] focus-visible:outline-none"
            >
              <Avatar size="default" className="ring-1 ring-white/10">
                <AvatarImage
                  src={user?.avatar_url}
                  className="size-9 object-cover"
                />
                <AvatarFallback className="bg-[#2f2f2f] text-xs text-white">
                  {user?.name?.slice(0, 2)?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <IconChevronDown className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            {user?.name ? (
              <>
                <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            ) : null}
            <DropdownMenuItem
              variant="destructive"
              onSelect={async (e) => {
                e.preventDefault();
                await handleLogout();
              }}
            >
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
