import { CollectionCover } from "@/components/collection-cover";
import { AIconClickup, AIconNotion } from "@/components/icons/base";
import { Button } from "@/components/ui/button";
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
    <div
      onClick={onClick}
      className="group relative flex h-[320px] cursor-pointer flex-col overflow-hidden rounded-2xl border-solid border-[#ffffff]/20! bg-[#161616] p-4 transition-[border-color,box-shadow,transform] duration-200 hover:border"
    >
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
            <div className="z-10 flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#303030] shadow-sm">
              <CollectionCover
                cover={collection.cover}
                alt={`${collection.name} cover`}
                className="size-full object-cover"
                fallback={
                  <span className="text-sm font-bold text-[#f2f2f2]">
                    {initial}
                  </span>
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
          <h3 className="truncate text-[18px] font-semibold tracking-[-0.02em] text-[#f2f2f2]">
            {collection.name}
          </h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Actions for ${collection.name}`}
              className="rounded-md p-1 text-[#898989] transition-colors hover:bg-white/8 hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <IconDotsVertical className="size-5" />
            </button>
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

      <div className="relative z-10 flex flex-1 flex-col gap-2 overflow-hidden">
        {taskPreview.map((task, index) => (
          <div
            key={task.uuid}
            className="flex min-h-11 items-center gap-2.5 rounded-xl border border-white/[0.045] bg-[#222222]/80 px-3 transition-colors group-hover:bg-[#202020]/85"
          >
            <span className="w-3 shrink-0 text-[12px] font-medium text-[#666]">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-[#c1c1c1]">
              {task.title}
            </span>
            <span className="shrink-0 text-[13px] text-[#858585] tabular-nums">
              {formatTaskDuration(task.estimated_time)}
            </span>
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/25 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <Button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onClick();
          }}
          className="focus-visible:ring-linkdo-blue/80 bg-accent pointer-events-auto flex h-10 items-center gap-1.5 rounded-full px-5 text-[14px] font-semibold text-white transition-transform duration-200 hover:scale-[1.03] focus-visible:ring-2 focus-visible:outline-none"
        >
          <IconArrowUpRight className="size-4" />
          Open
        </Button>
      </div>

      <div className="relative z-10 mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
        <span className="text-[13px] font-semibold text-[#b0b0b0]">
          {collection.pending_count} pending tasks
        </span>
        {estimated && (
          <span className="text-[13px] font-semibold text-[#b0b0b0]">
            Est: {estimated}
          </span>
        )}
      </div>
    </div>
  );
}

function formatTaskDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
}
