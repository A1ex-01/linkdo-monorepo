import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CollectionCover } from "@/components/collection-cover";
import { getTaskPreview } from "@/lib/collection-tasks";
import { deleteCollection, getTasks } from "@/services/collection";
import { resolveFilePath } from "@/services/file";
import { ICollection, TaskStatus } from "@/types/base";
import { formatEstimated } from "@/utils/base";
import {
  IconArrowUpRight,
  IconBrandNotion,
  IconDotsVertical,
  IconTrash,
} from "@tabler/icons-react";
import { useRequest } from "ahooks";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

interface ICollectionCardProps {
  collection: ICollection;
  onClick: () => void;
  onDeleted?: (uuid: string) => void;
}
export default function CollectionCard({
  collection,
  onClick,
  onDeleted,
}: ICollectionCardProps) {
  const estimated = formatEstimated(collection.estimated_total);
  const [deleting, setDeleting] = useState(false);
  const { data: tasks = [] } = useRequest(async () => {
    const res = await getTasks(collection.uuid);
    return res.data ?? [];
  });
  const taskPreview = useMemo(() => getTaskPreview(tasks), [tasks]);

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
      className="group bg-card relative flex h-[303px] cursor-pointer flex-col overflow-hidden rounded-xl border border-[#363636] p-6 transition-all hover:border-[#525252]"
    >
      {collection.cover ? (
        <img
          src={resolveFilePath(collection.cover)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
      ) : null}
      <div className="relative z-10 mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#363636]">
            <CollectionCover
              cover={collection.cover}
              alt={`${collection.name} cover`}
              className="size-full object-cover"
              fallback={<IconBrandNotion className="text-atext-500 h-5 w-5" />}
            />
          </div>
          <h3 className="text-atext-500 font-medium">{collection.name}</h3>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <IconDotsVertical className="text-atext-460 h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px]">
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

      <div className="flex flex-1 flex-col justify-center gap-2 overflow-hidden">
        {taskPreview.map((task) => (
          <div key={task.uuid} className="flex items-center gap-2">
            <span
              className={`size-2 shrink-0 rounded-full ${STATUS_DOT_CLASS[task.status]}`}
              aria-hidden
            />
            <span className="text-atext-400 truncate text-sm">
              {task.title}
            </span>
            <span className="text-atext-460 ml-auto shrink-0 text-xs">
              {STATUS_LABEL[task.status]}
            </span>
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#141414]/70 opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover:opacity-100">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onClick();
          }}
          className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/15 bg-[#252525] px-4 py-2 text-sm font-medium text-white shadow-lg transition-transform duration-200 hover:scale-[1.03] hover:bg-[#303030] focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
        >
          Open
          <IconArrowUpRight className="size-4" />
        </button>
      </div>

      <div className="relative z-10 mt-4 flex items-center justify-between border-t border-[#363636] pt-4">
        <span className="text-atext-450 text-xs font-bold tracking-wide uppercase">
          {collection.pending_count} pending tasks
        </span>
        {estimated && (
          <span className="bg-muted text-atext-460 rounded px-2 py-1 text-xs">
            Est: {estimated}
          </span>
        )}
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<TaskStatus, string> = {
  backlog: "Backlog",
  this_week: "This week",
  today: "Today",
  done: "Done",
};

const STATUS_DOT_CLASS: Record<TaskStatus, string> = {
  backlog: "bg-zinc-500",
  this_week: "bg-blue-400",
  today: "bg-amber-400",
  done: "bg-emerald-400",
};
