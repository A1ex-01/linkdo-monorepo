"use client";
import { ThemeProvider } from "@/components/theme-provider";
import { useUserStore } from "@/stores/user";
import { useMount } from "ahooks";
import React from "react";
import { Toaster } from "react-hot-toast";

interface IProviders {
  children: React.ReactNode;
}

export default function Providers({ children }: IProviders) {
  const { fetchUser, isFetchedUser } = useUserStore();
  useMount(() => {
    fetchUser();
  });
  if (!isFetchedUser) {
    return null;
  }
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <Toaster
        toastOptions={{
          style: {
            borderRadius: "10px",
            background: "#333",
            color: "#fff",
          },
        }}
      />
      {children}
    </ThemeProvider>
  );
}
