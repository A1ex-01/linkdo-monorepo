"use client";
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
 <>
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
 </>
 );
}
