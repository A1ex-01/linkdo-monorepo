"use client";

import { AIconClickup, AIconNotion } from "@/components/icons/base";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserStore } from "@/stores/user";
import { IconApps, IconPlugConnected } from "@tabler/icons-react";
import toast from "react-hot-toast";
import { launchDesktopLinkOAuth } from "./link-oauth";

export function AppsDropdown() {
  const { user, fetchUser } = useUserStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="My apps"
          className="text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <IconApps />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-2">
        <DropdownMenuLabel className="text-foreground px-2 py-1.5 text-sm">
          My Apps
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <ConnectionItem
            name="Notion"
            icon={<AIconNotion className="size-7" />}
            connected={Boolean(user?.notion_user_id)}
            connectionName={user?.name}
            onConnect={() => launchDesktopLinkOAuth("notion", fetchUser)}
          />
          <ConnectionItem
            name="ClickUp"
            icon={<AIconClickup alt="" className="size-7" />}
            connected={Boolean(user?.clickup_connected)}
            connectionName={user?.name}
            onConnect={() => launchDesktopLinkOAuth("clickup", fetchUser)}
          />
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem disabled className="gap-3 px-2 py-2.5">
            <span className="bg-muted flex size-8 items-center justify-center rounded-md">
              <IconPlugConnected />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-foreground font-medium">MCP Server</span>
              <span className="text-muted-foreground text-xs">
                Bring your tools into Link-Do
              </span>
            </span>
            <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
              Coming soon
            </span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ConnectionItem({
  name,
  icon,
  connected,
  connectionName,
  onConnect,
}: {
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  connectionName?: string;
  onConnect: () => Promise<void>;
}) {
  return (
    <DropdownMenuItem
      // disabled={connected}
      className="gap-3"
      onSelect={(event) => {
        event.preventDefault();
        void onConnect().catch(() => {
          toast.error(`Unable to open ${name} authorization`);
        });
      }}
    >
      <span className="bg-muted flex size-8 items-center justify-center rounded-md">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-foreground font-medium">{name}</span>
        <span className="text-muted-foreground truncate text-xs">
          {connected ? connectionName || "Connected" : "Not connected"}
        </span>
      </span>
      {connected ? (
        <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
          Connected
        </span>
      ) : (
        <span className="text-foreground text-sm font-medium">+ Connect</span>
      )}
    </DropdownMenuItem>
  );
}
