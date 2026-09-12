"use client";
import {
  redirectToLogin,
  scheduleTokenExpiration,
  TOKEN_CHANGED_EVENT,
} from "@/services/auth-session";
import { getToken } from "@/services/client-request";
import { useUserStore } from "@/stores/user";
import { useMount } from "ahooks";
import { ThemeProvider } from "next-themes";
import type React from "react";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

interface IProviders {
  children: React.ReactNode;
}

export default function Providers({ children }: IProviders) {
  const { fetchUser, isFetchedUser, clearUser } = useUserStore();
  useMount(() => {
    fetchUser();
  });

  useEffect(() => {
    const expireSession = () => {
      clearUser();
      redirectToLogin();
    };
    const watchToken = () => scheduleTokenExpiration(getToken(), expireSession);
    let stopWatching = watchToken();

    const handleTokenChange = () => {
      stopWatching();
      stopWatching = watchToken();
    };

    window.addEventListener(TOKEN_CHANGED_EVENT, handleTokenChange);
    return () => {
      stopWatching();
      window.removeEventListener(TOKEN_CHANGED_EVENT, handleTokenChange);
    };
  }, [clearUser]);
  if (!isFetchedUser) {
    return null;
  }
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Toaster
        toastOptions={{
          style: {
            borderRadius: "10px",
            background: "hsl(var(--popover))",
            color: "hsl(var(--popover-foreground))",
          },
        }}
      />
      {children}
    </ThemeProvider>
  );
}
