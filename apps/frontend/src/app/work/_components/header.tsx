// frontend/src/components/work/header.tsx

"use client";

import { AppsDropdown } from "@/app/work/_components/apps-dropdown";
import { ClickUpDropdown } from "@/app/work/_components/clickup-dropdown";
import { NotionDropdown } from "@/app/work/_components/notion-dropdown";
import { TaskSearch } from "@/app/work/_components/task-search";
import { useData } from "@/app/work/data-provider";
import { AccountSettingsDialog } from "@/components/account-settings-dialog";
import { CollectionCover } from "@/components/collection-cover";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
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
import { resolveFilePath } from "@/services/file";
import { useUserStore } from "@/stores/user";
import { formatEstimated } from "@/utils/base";
import {
  IconChevronDown,
  IconChevronLeft,
  IconLogout,
  IconSettings,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export function WorkHeader() {
  const router = useRouter();
  const { collection, collections } = useData();
  const { user, clearUser } = useUserStore();
  const [settingsOpen, setSettingsOpen] = useState(false);

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild data-tauri-drag-region="false">
              <button
                type="button"
                aria-label="Switch list"
                className="group/collection flex items-center gap-1.5 rounded-md bg-[#181818] px-4 py-1 text-lg font-medium text-white transition-colors hover:bg-[#242424] focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:outline-none"
              >
                <span className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#6f98e8]/15 text-xs font-semibold text-[#8eaeef]">
                  <CollectionCover
                    cover={collection.cover}
                    alt=""
                    className="size-full object-cover"
                    fallback={collection.name.trim().charAt(0).toUpperCase()}
                  />
                </span>
                <span className="max-w-[28ch] truncate">{collection.name}</span>
                <IconChevronDown className="size-4 text-[#858585] transition-transform group-data-[state=open]/collection:rotate-180" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-72 w-64">
              {collections.map((item) => (
                <DropdownMenuItem
                  key={item.uuid}
                  disabled={item.uuid === collection.uuid}
                  onSelect={() => router.replace(`/work?uuid=${item.uuid}`)}
                >
                  <span className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#6f98e8]/15 text-xs font-semibold text-[#8eaeef]">
                    <CollectionCover
                      cover={item.cover}
                      alt=""
                      className="size-full object-cover"
                      fallback={item.name.trim().charAt(0).toUpperCase()}
                    />
                  </span>
                  <span className="truncate">{item.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        {collection ? (
          <div className="text-atext-460 text-sm">
            This list has {collection.pending_count} pending tasks
            {formatEstimated(collection.estimated_total)
              ? `, Est: ${formatEstimated(collection.estimated_total)}`
              : ""}
          </div>
        ) : null}
      </div>

      {/* Right: Link providers + Avatar dropdown */}
      <div className="flex items-center gap-3">
        <NotionDropdown className="w-full" />
        <ClickUpDropdown />
        <TaskSearch />
        <AppsDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger asChild data-tauri-drag-region="false">
            <button
              type="button"
              className="text-atext-460 flex cursor-pointer items-center gap-2 rounded-xs bg-[#181818] px-3 py-1.5 transition-colors hover:bg-[#222] focus-visible:outline-none"
            >
              <Avatar size="default" className="ring-1 ring-white/10">
                <AvatarImage
                  src={resolveFilePath(user?.avatar_url)}
                  className="object-cover"
                />
                <AvatarFallback className="bg-[#2f2f2f] text-xs text-white">
                  {user?.name?.slice(0, 2)?.toUpperCase() ?? "U"}
                </AvatarFallback>
                <AvatarBadge className="bg-green-600 dark:bg-green-800" />
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
              onSelect={(event) => {
                event.preventDefault();
                setSettingsOpen(true);
              }}
            >
              <IconSettings />
              Account settings
            </DropdownMenuItem>
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
      <AccountSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </header>
  );
}
