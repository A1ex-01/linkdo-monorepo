"use client";

import { AccountSettingsDialog } from "@/components/account-settings-dialog";
import { AIconLinkdo } from "@/components/icons/base";
import { LoadingScreen } from "@/components/motion/loading-screen";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@linkdo/ui/components/avatar";
import { Card, CardContent } from "@linkdo/ui/components/card";
import { HomeWindowTitleBar } from "@/components/window-title-bar";
import {
  createCollection,
  getCollections,
  updateCollection,
} from "@/services/collection";
import { resolveFilePath } from "@/services/file";
import { useUserStore } from "@/stores/user";
import type { ICollection } from "@/types/base";
import { getGreeting, getGreetingMessage } from "@/utils/base";
import { IconLoader, IconPlus, IconStarFilled } from "@tabler/icons-react";
import { useRequest } from "ahooks";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import CollectionCard from "./_components/collection-card";
import CreateCollectionModal from "./_components/create-collection-modal";
import Sidebar from "./_components/sidebar";

export default function HomePage() {
  const router = useRouter();
  const { user } = useUserStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<ICollection>();
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
    async (data: { name: string; cover?: string }) => {
      const res = await createCollection(data);
      return res;
    },
    { manual: true },
  );

  const handleCreate = () => {
    setEditingCollection(undefined);
    setIsModalOpen(true);
  };

  const handleSubmitCreate = async (data: { name: string; cover?: string }) => {
    if (editingCollection) {
      const res = await updateCollection(editingCollection.uuid, data);
      if (res.success) {
        refresh();
        toast.success("Collection updated");
      } else {
        toast.error(res.message || "Failed to update collection");
      }
      return;
    }
    try {
      const toastId = toast.loading("Creating collection...");
      const res = await submitCreate(data);
      if (res.success) {
        refresh();
        toast.success("Collection created successfully", { id: toastId });
      }
    } catch (err) {
      console.error("Failed to create collection:", err);
      toast.error("Failed to create collection");
    }
  };

  const [isLoadingScreen, setIsLoadingScreen] = useState(true);
  const { isFetchedUser } = useUserStore();

  if (isLoadingScreen) {
    if (!isFetchedUser) return <IconLoader />;
    return (
      <LoadingScreen
        icons={[
          {
            type: "linkdo",
          },
          {
            type: "name",
            value: user?.name?.slice(0, 1) || "L",
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
              <AIconLinkdo alt="Linkdo" className="size-10 rounded-md" />
              <span className="text-foreground text-2xl leading-tight font-extrabold">
                Linkdo
              </span>
            </div>
            <span className="-mt-2 mb-2 text-[15px] font-medium">v1.0.0</span>
            <div className="bg-background border-border flex w-full flex-col rounded-xl border px-4 py-3">
              <div className="text-foreground mb-1 flex items-center gap-2">
                <IconStarFilled size={18} className="" />
                <span className="text-base font-bold">Free</span>
              </div>
              <span className="text-f text-muted-foreground text-sm">
                无限制
              </span>
            </div>
          </div>

          <Sidebar onCreateCollection={handleCreate} />
        </div>
        <div className="right w-full flex-1">
          <header className="flex h-[80px] w-full items-center justify-between px-10 py-6 backdrop-blur-sm">
            <div>
              <h1 className="text-2xl font-extrabold tracking-[-0.6px]">
                {getGreeting()}, {user?.name}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {getGreetingMessage()}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Avatar onClick={() => setIsSettingsOpen(true)}>
                <AvatarImage
                  src={resolveFilePath(user?.avatar_url)}
                  className="object-cover"
                />
                <AvatarFallback className="">
                  {user?.name.slice(0, 2) ?? "U"}
                </AvatarFallback>
                <AvatarBadge className="bg-green-600 dark:bg-green-800" />
              </Avatar>
            </div>
          </header>

          <div className="flex w-full">
            <main className="flex-1 px-8">
              <div className="mb-4 flex items-end justify-between">
                <h2 className="text-xl font-bold">Your Lists</h2>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">
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
                      className="bg-card h-[320px] animate-pulse rounded-xl"
                    />
                  ))}
                </div>
              ) : collections.length === 0 ? (
                <div className="border-muted-foreground/30 text-muted-foreground flex flex-col items-center justify-center rounded-2xl border border-dashed py-20">
                  <p className="mb-4 text-lg font-medium">No lists yet</p>
                  <button
                    type="button"
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
                      onEdit={() => {
                        setEditingCollection(collection);
                        setIsModalOpen(true);
                      }}
                      onDeleted={() => {
                        refresh();
                      }}
                    />
                  ))}

                  {/* Create List Card */}
                  <Card
                    onClick={handleCreate}
                    className="group hover:border-muted-foreground/50 aspect-square cursor-pointer hover:border"
                  >
                    <CardContent className="flex h-full flex-col items-center justify-center">
                      <span className="text-foreground mt-5 text-[15px] font-semibold">
                        Create new list
                      </span>
                      <div className="text-muted-foreground mt-2 max-w-[190px] text-center text-xs leading-5">
                        A focused home for the work you want to move forward.
                      </div>
                      <span className="text-foreground mt-5 text-[11px] font-bold tracking-[0.12em] uppercase opacity-60 transition-opacity duration-200 group-hover:opacity-100">
                        Start building
                      </span>
                    </CardContent>
                  </Card>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      <CreateCollectionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCollection(undefined);
        }}
        onSubmit={handleSubmitCreate}
        collection={editingCollection}
      />
      <AccountSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
    </div>
  );
}
