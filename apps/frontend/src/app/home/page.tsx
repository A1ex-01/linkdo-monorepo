"use client";

import { AccountSettingsDialog } from "@/components/account-settings-dialog";
import { LoadingScreen } from "@/components/motion/loading-screen";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { HomeWindowTitleBar } from "@/components/window-title-bar";
import { createCollection, getCollections } from "@/services/collection";
import { resolveFilePath } from "@/services/file";
import { useUserStore } from "@/stores/user";
import { getGreeting, getGreetingMessage } from "@/utils/base";
import { IconPlus, IconStarFilled } from "@tabler/icons-react";
import { useRequest } from "ahooks";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import CollectionCard from "./_components/collection-card";
import CreateCollectionModal from "./_components/create-collection-modal";
import Sidebar from "./_components/sidebar";

export default function page() {
  const router = useRouter();
  const { user } = useUserStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const {
    loading,
    refresh,
    data: collections = [],
  } = useRequest(
    async () => {
      const res = await getCollections();
      return res.data;
    },
    {
      manual: false,
    },
  );

  const { runAsync: submitCreate } = useRequest(
    async (data: { name: string; icon: string; cover?: string }) => {
      const res = await createCollection(data);
      return res;
    },
    { manual: true },
  );

  const handleCreate = () => setIsModalOpen(true);

  const handleSubmitCreate = async (data: { name: string; icon: string }) => {
    try {
      toast.loading("Creating collection...");
      const res = await submitCreate(data);
      if (res.success) {
        refresh();
        toast.success("Collection created successfully");
      }
    } catch (err) {
      console.error("Failed to create collection:", err);
      toast.error("Failed to create collection");
    }
  };

  const [isLoadingScreen, setIsLoadingScreen] = useState(true);

  if (isLoadingScreen) {
    return (
      <LoadingScreen
        icons={[
          {
            type: "linkdo",
          },
          {
            type: "name",
            value: "P",
          },
        ]}
        loadId="home"
        onComplete={() => {
          setIsLoadingScreen(false);
        }}
      />
    );
  }

  return (
    <div className="text-foreground bg-background flex min-h-screen flex-col">
      <HomeWindowTitleBar />
      <div className="flex w-full flex-1">
        <div className="left bg-card text-foreground w-[280px] px-4">
          <div className="flex flex-col items-start gap-4 pt-4">
            <div className="mb-1 flex items-center gap-2">
              <img src={"/logo.png"} className="size-10 rounded-md" />
              <span className="text-foreground text-2xl leading-tight font-extrabold">
                LinkDo
              </span>
            </div>
            <span className="text-atext-460 -mt-2 mb-2 text-[15px] font-medium">
              v1.0.0
            </span>
            <div className="bg-background flex w-full flex-col rounded-xl border border-[#363636] px-4 py-3">
              <div className="mb-1 flex items-center gap-2">
                <IconStarFilled size={18} className="text-atext-450" />
                <span className="text-atext-450 text-base font-bold">
                  Unlimited Monthly
                </span>
              </div>
              <span className="text-atext-460 text-sm">无限制使用所有功能</span>
            </div>
          </div>

          <Sidebar onCreateCollection={handleCreate} />
        </div>
        <div className="right w-full flex-1">
          <header className="flex h-[80px] w-full items-center justify-between px-10 py-6 backdrop-blur-sm">
            <div>
              <h1 className="text-atext-500 text-2xl font-extrabold tracking-[-0.6px]">
                {getGreeting()}, {user?.name}
              </h1>
              <p className="text-atext-450 mt-1 text-sm">
                {getGreetingMessage()}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <button
                type="button"
                aria-label="Open account settings"
                onClick={() => setIsSettingsOpen(true)}
                className="rounded-full focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
              >
                <Avatar>
                  <AvatarImage
                    src={resolveFilePath(user?.avatar_url)}
                    className="size-10 object-cover"
                  />
                  <AvatarFallback className="bg-primary-500">
                    {user?.name.slice(0, 2) ?? "U"}
                  </AvatarFallback>
                  <AvatarBadge className="bg-green-600" />
                </Avatar>
              </button>
            </div>
          </header>

          <div className="flex w-full">
            <main className="flex-1 px-8">
              <div className="mb-4 flex items-end justify-between">
                <h2 className="text-atext-500 text-xl font-bold">Your Lists</h2>
                <div className="flex items-center gap-2">
                  <span className="text-atext-400 text-sm">
                    Lists with your upcoming tasks
                  </span>
                </div>
              </div>

              {/* Bento Grid */}
              {loading ? (
                <div className="grid grid-cols-4 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-card h-[303px] animate-pulse rounded-xl"
                    />
                  ))}
                </div>
              ) : collections.length === 0 ? (
                <div className="border-muted-foreground/30 text-muted-foreground flex flex-col items-center justify-center rounded-2xl border border-dashed py-20">
                  <p className="mb-4 text-lg font-medium">No lists yet</p>
                  <button
                    onClick={handleCreate}
                    className="hover:text-foreground flex items-center gap-2 text-sm font-medium transition-colors"
                  >
                    <IconPlus className="h-5 w-5" />
                    Create your first list
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-6">
                  {collections.map((collection) => (
                    <CollectionCard
                      key={collection.uuid}
                      collection={collection}
                      onClick={() => {
                        router.push(`/work?uuid=${collection.uuid}`);
                      }}
                      onDeleted={() => {
                        refresh();
                      }}
                    />
                  ))}

                  {/* Create List Card */}
                  <div
                    onClick={handleCreate}
                    className="border-muted-foreground/20 hover:bg-muted bg-card flex h-[303px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all"
                  >
                    <svg
                      width={52}
                      height={60}
                      viewBox="0 0 52 60"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g filter="url(#filter0_ddd_6_172)">
                        <rect
                          x={2}
                          y={1}
                          width={48}
                          height={56}
                          rx={4}
                          fill="#262626"
                        />
                        <rect
                          x={2.5}
                          y={1.5}
                          width={47}
                          height={55}
                          rx={3.5}
                          stroke="#363636"
                        />
                        <g opacity={0.4}>
                          <rect
                            x={9}
                            y={8}
                            width={34}
                            height={4}
                            rx={2}
                            fill="#6f98e8"
                          />
                        </g>
                        <g opacity={0.2}>
                          <rect
                            x={9}
                            y={16}
                            width={22.6641}
                            height={4}
                            rx={2}
                            fill="#6f98e8"
                          />
                        </g>
                        <g opacity={0.2}>
                          <rect
                            x={9}
                            y={24}
                            width={17}
                            height={4}
                            rx={2}
                            fill="#6f98e8"
                          />
                        </g>
                      </g>
                      <defs>
                        <filter
                          id="filter0_ddd_6_172"
                          x={0}
                          y={0}
                          width={52}
                          height={60}
                          filterUnits="userSpaceOnUse"
                          colorInterpolationFilters="sRGB"
                        >
                          <feFlood
                            floodOpacity={0}
                            result="BackgroundImageFix"
                          />
                          <feColorMatrix
                            in="SourceAlpha"
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            result="hardAlpha"
                          />
                          <feOffset />
                          <feColorMatrix
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"
                          />
                          <feBlend
                            mode="normal"
                            in2="BackgroundImageFix"
                            result="effect1_dropShadow_6_172"
                          />
                          <feColorMatrix
                            in="SourceAlpha"
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            result="hardAlpha"
                          />
                          <feOffset />
                          <feColorMatrix
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"
                          />
                          <feBlend
                            mode="normal"
                            in2="effect1_dropShadow_6_172"
                            result="effect2_dropShadow_6_172"
                          />
                          <feColorMatrix
                            in="SourceAlpha"
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            result="hardAlpha"
                          />
                          <feOffset dy={1} />
                          <feGaussianBlur stdDeviation={1} />
                          <feColorMatrix
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"
                          />
                          <feBlend
                            mode="normal"
                            in2="effect2_dropShadow_6_172"
                            result="effect3_dropShadow_6_172"
                          />
                          <feBlend
                            mode="normal"
                            in="SourceGraphic"
                            in2="effect3_dropShadow_6_172"
                            result="shape"
                          />
                        </filter>
                      </defs>
                    </svg>
                    <span className="text-atext-450 mt-4 text-sm font-medium">
                      + 创建新列表
                    </span>
                    <div className="text-atext-450 mt-4 text-xs">
                      整理你的任务，高效专注每一天
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      <CreateCollectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitCreate}
      />
      <AccountSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </div>
  );
}
