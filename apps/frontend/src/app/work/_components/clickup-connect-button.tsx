"use client";

import { Button } from "@/components/ui/button";
import { useUserStore } from "@/stores/user";
import { IconChecklist } from "@tabler/icons-react";
import toast from "react-hot-toast";
import { launchDesktopLinkOAuth } from "./link-oauth";

export function ClickUpConnectButton() {
  const { fetchUser } = useUserStore();

  const connect = async () => {
    try {
      await launchDesktopLinkOAuth("clickup", fetchUser);
    } catch {
      toast.error("Unable to open ClickUp authorization");
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={connect}>
      <IconChecklist data-icon="inline-start" />
      ClickUp
    </Button>
  );
}
