"use client";

import {
  AIconClickup,
  AIconLinkdo,
  AIconNotion,
} from "@/components/icons/base";
import { resolveFilePath } from "@/services/file";
import { ICollection } from "@/types/base";
import { IconTransition } from "./icon-transition";

export type CollectionLoadingIcon = "collection" | "notion" | "clickup";

export function getCollectionLoadingIcons(
  collection: Pick<ICollection, "notion_databases" | "clickup_lists">,
): CollectionLoadingIcon[] {
  return [
    "collection",
    ...(collection.notion_databases?.length ? (["notion"] as const) : []),
    ...(collection.clickup_lists?.length ? (["clickup"] as const) : []),
  ];
}

export function LoadingScreen({
  loadId,
  icons,
  onComplete,
}: {
  loadId: string;
  onComplete?: () => void;
  icons: {
    type: "linkdo" | "notion" | "clickup" | "name" | "url";
    value?: string;
  }[];
}) {
  const items = icons.map(({ type, value }) => {
    if (type === "linkdo") {
      return <AIconLinkdo key={type} className="size-full rounded-2xl" />;
    }
    if (type === "notion") {
      return <AIconNotion key={type} className="size-full rounded-2xl" />;
    }
    if (type === "clickup") {
      return <AIconClickup key={type} className="size-full rounded-2xl" />;
    }
    if (type === "name") {
      return (
        <div
          key={type}
          className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-white text-2xl font-bold text-black"
        >
          {value}
        </div>
      );
    }
    if (type === "url") {
      return (
        <img
          src={resolveFilePath(value)}
          alt={""}
          className={"size-full rounded-2xl"}
        />
      );
    }
  });

  return (
    <main
      className="bg-background flex h-full items-center justify-center"
      aria-label="Loading list"
    >
      <div className="flex flex-col items-center gap-5">
        <IconTransition
          key={loadId}
          items={items}
          itemDuration={1000}
          loop={false}
          onComplete={onComplete}
          className="size-16"
        />
      </div>
    </main>
  );
}
