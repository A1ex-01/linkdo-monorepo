"use client";
import { useUserStore } from "@/stores/user";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const { isFetchedUser, user } = useUserStore();

  useEffect(() => {
    if (isFetchedUser) {
      if (user?.uuid) {
        router.replace("/home");
      } else {
        router.replace("/login");
      }
    }
  }, [isFetchedUser, user?.uuid]);

  return <div className="bg-background h-screen w-full" />;
}
