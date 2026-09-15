// desktop/src/components/work/header.tsx

"use client";

import { AppsDropdown } from "@/app/work/_components/apps-dropdown";
import { ClickUpDropdown } from "@/app/work/_components/clickup-dropdown";
import { NotionDropdown } from "@/app/work/_components/notion-dropdown";
import { TaskSearch } from "@/app/work/_components/task-search";
import { useData } from "@/app/work/data-provider";
import { AccountSettingsDialog } from "@/components/account-settings-dialog";
import { CollectionCover } from "@/components/collection-cover";
import { SystemSettingsDialog } from "@/components/system-settings-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@linkdo/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@linkdo/ui/components/dropdown-menu";
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
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [systemSettingsOpen, setSystemSettingsOpen] = useState(false);

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
      className="text-foreground sticky top-0 z-30 flex h-14 w-screen items-center justify-between px-5"
    >
      {/* Left: Brand + Collection */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.push("/home")}
          className="text-muted-foreground hover:text-foreground group/brand flex items-center gap-1 rounded-md px-2 py-1 text-[15px] font-semibold tracking-tight transition-colors"
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
                className="bg-card text-card-foreground hover:bg-accent focus-visible:ring-ring group/collection flex items-center gap-1.5 rounded-md px-4 py-1 text-lg font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <span className="bg-muted text-muted-foreground flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-md text-xs font-semibold">
                  <CollectionCover
                    cover={collection.cover}
                    alt=""
                    className="size-full object-cover"
                    fallback={collection.name.trim().charAt(0).toUpperCase()}
                  />
                </span>
                <span className="max-w-[28ch] truncate">{collection.name}</span>
                <IconChevronDown className="text-muted-foreground size-4 transition-transform group-data-[state=open]/collection:rotate-180" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-72 w-64">
              {collections.map((item) => (
                <DropdownMenuItem
                  key={item.uuid}
                  disabled={item.uuid === collection.uuid}
                  onSelect={() => router.replace(`/work?uuid=${item.uuid}`)}
                >
                  <span className="bg-muted text-muted-foreground flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-md text-xs font-semibold">
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
          <div className="text-muted-foreground text-sm">
            This list has {collection.pending_count} pending tasks
            {formatEstimated(collection.estimated_total)
              ? `, Est: ${formatEstimated(collection.estimated_total)}`
              : ""}
          </div>
        ) : null}
      </div>

      {/* Right: Link providers + Avatar dropdown */}
      <div className="flex items-center gap-3">
        <div className="bg-muted flex h-[44px] items-center gap-4 rounded-lg px-3">
          <NotionDropdown className="shrink-0" />
          <ClickUpDropdown />
        </div>

        <div className="bg-muted flex items-center gap-4 rounded-lg py-1 pr-2 pl-4">
          <ThemeToggle />

          <TaskSearch />
          <AppsDropdown />

          <IconSettings
            className="text-muted-foreground hover:text-accent-foreground size-6 cursor-pointer"
            onClick={() => setSystemSettingsOpen(true)}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild data-tauri-drag-region="false">
              <div className="hover:bg-accent -ml-2 flex cursor-pointer items-center gap-2 rounded px-2 py-1.5">
                <Avatar size="sm" className="">
                  <AvatarImage
                    src={resolveFilePath(user?.avatar_url)}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                    {user?.name?.slice(0, 2)?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                  <AvatarBadge />
                </Avatar>
                <IconChevronDown className="size-4" />
              </div>
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
                  setAccountSettingsOpen(true);
                }}
              >
                <IconSettings />
                Account settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  setSystemSettingsOpen(true);
                }}
              >
                <IconSettings />
                System settings
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
      </div>
      <AccountSettingsDialog
        open={accountSettingsOpen}
        onOpenChange={setAccountSettingsOpen}
      />
      <SystemSettingsDialog
        open={systemSettingsOpen}
        onOpenChange={setSystemSettingsOpen}
      />
    </header>
  );
}
