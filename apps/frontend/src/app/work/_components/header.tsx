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
import { Button } from "../../../components/ui/button";

const DEFAULT_AVATAR_URL =
  "https://picx.zhimg.com/v2-0ad38053cbe09a5066b16c0a129fac10_xl.jpg?source=32738c0c&needBackground=1";

export function WorkHeader() {
  const router = useRouter();
  const { collection } = useData();

  const { user } = useUserStore();

  return (
    <header className="text-atext-500 flex h-16 w-screen items-center justify-between px-6">
      {/* Left: Logo and Collection Name */}
      <div className="flex items-center gap-8">
        <Button
          variant={"ghost"}
          size={"lg"}
          onClick={() => router.push("/home")}
          className="flex items-center text-2xl font-extrabold"
        >
          <div className="flex items-center gap-2">
            <IconChevronLeft className="size-5" strokeWidth={3} />
            <div className="leading-none">LinkDo</div>
          </div>
        </Button>

        {collection?.name && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold">{collection.name}</span>
              <IconChevronDown className="text-atext-450 size-5" />
            </div>
          </>
        )}
      </div>

 {/* Right: Nav and User */}
 <div className="flex items-center gap-6">
 {/* Notion Dropdown */}
 <NotionDropdown className="w-full" />
 <div className="flex items-center gap-4">
 <Avatar>
 <AvatarImage
 src={user?.avatar_url}
 className="size-10 object-cover"
 />
 <AvatarFallback className="bg-primary-500">
 {user?.name.slice(0, 2) ?? "U"}
 </AvatarFallback>
 <AvatarBadge className="bg-green-600" />
 </Avatar>
 </div>
 </div>
 </header>
 );
}
