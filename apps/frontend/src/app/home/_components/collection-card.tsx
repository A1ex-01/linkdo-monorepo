import { CollectionCover } from "@/components/collection-cover";
import { AIconClickup, AIconNotion } from "@/components/icons/base";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getTaskPreview } from "@/lib/collection-tasks";
import { deleteCollection, getTasks } from "@/services/collection";
import { resolveFilePath } from "@/services/file";
import type { ICollection } from "@/types/base";
import { formatEstimated } from "@/utils/base";
import {
  IconArrowUpRight,
  IconDotsVertical,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";
import { useRequest } from "ahooks";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

interface ICollectionCardProps {
  collection: ICollection;
  onClick: () => void;
  onEdit: () => void;
  onDeleted?: (uuid: string) => void;
}
export default function CollectionCard({
  collection,
  onClick,
  onEdit,
  onDeleted,
}: ICollectionCardProps) {
  const estimated = formatEstimated(collection.estimated_total);
  const [deleting, setDeleting] = useState(false);
  const { data: tasks = [] } = useRequest(async () => {
    const res = await getTasks(collection.uuid);
    return res.data ?? [];
  });
  const taskPreview = useMemo(() => getTaskPreview(tasks).slice(0, 4), [tasks]);
  const initial = collection.name.trim().charAt(0).toUpperCase() || "?";

  const handleDelete = async (e: Event) => {
    e.preventDefault();
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await deleteCollection(collection.uuid);
      if (res.success) {
        toast.success("Collection deleted");
        onDeleted?.(collection.uuid);
      } else {
        toast.error(res.message || res.error || "Failed to delete collection");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete collection",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card
      onClick={onClick}
      className="group relative aspect-square cursor-pointer"
      // className="group relative flex h-[320px] cursor-pointer flex-col overflow-hidden rounded-2xl border-solid border-[#ffffff]/20! bg-[#161616] p-4 transition-[border-color,box-shadow,transform] duration-200 hover:border"
    >
      <CardContent className="flex h-full flex-col">
        {collection.cover ? (
          <img
            src={resolveFilePath(collection.cover)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-[0.13]"
          />
        ) : null}
        <div className="relative z-10 mb-4 flex items-start justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex -space-x-2">
              <div className="border-border/10 z-10 flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border shadow-sm">
                <CollectionCover
                  cover={collection.cover}
                  alt={`${collection.name} cover`}
                  className="size-full object-cover"
                  fallback={
                    <span className="font-bold] text-sm">{initial}</span>
                  }
                />
              </div>
              {collection.notion_databases?.length ? (
                <span className="z-[2] flex size-9 items-center justify-center rounded-lg border-2 border-[#161616] bg-white shadow-sm">
                  <AIconNotion alt="Notion" className="size-5" />
                </span>
              ) : null}
              {collection.clickup_lists?.length ? (
                <span className="z-[1] flex size-9 items-center justify-center rounded-lg border-2 border-[#161616] bg-white shadow-sm">
                  <AIconClickup alt="ClickUp" className="size-5" />
                </span>
              ) : null}
            </div>
            <h3 className="truncate text-[18px] font-semibold tracking-[-0.02em]">
              {collection.name}
            </h3>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size={"icon"}
                type="button"
                variant={"ghost"}
                aria-label={`Actions for ${collection.name}`}
                className="rounded-md p-1 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <IconDotsVertical className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  onEdit();
                }}
                onClick={(event) => event.stopPropagation()}
              >
                <IconPencil />
                Edit collection
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                disabled={deleting}
                onSelect={handleDelete}
                onClick={(e) => e.stopPropagation()}
              >
                <IconTrash />
                {deleting ? "Deleting..." : "Delete Collection"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="relative z-10 flex flex-1 flex-col gap-2">
          {taskPreview.map((task, index) => (
            <div
              key={task.uuid}
              className="flex min-h-11 items-center gap-2.5 rounded-xl border px-3 transition-colors"
            >
              <span className="text-muted-foreground w-3 shrink-0 text-[12px] font-medium">
                {index + 1}
              </span>
              <span className="text-muted-foreground min-w-0 flex-1 truncate text-[15px] font-medium">
                {task.title}
              </span>
              <span className="text-muted-foreground/70 shrink-0 text-[13px] tabular-nums">
                {formatTaskDuration(task.estimated_time)}
              </span>
            </div>
          ))}
        </div>

        <div className="bg-foreground/20 pointer-events-none absolute inset-0 z-20 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <Button
            onClick={(event) => {
              event.stopPropagation();
              onClick();
            }}
          >
            <IconArrowUpRight className="size-4" />
            Open
          </Button>
        </div>

        <div className="border-border text-muted-foreground/50 relative z-10 mt-auto flex items-center justify-between border-t pt-3">
          <span className="text-[13px] font-semibold">
            {collection.pending_count} pending tasks
          </span>
          {estimated && (
            <span className="text-[13px] font-semibold">Est: {estimated}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatTaskDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
}
