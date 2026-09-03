import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getTaskPreview } from "@/lib/collection-tasks";
import { deleteCollection, getTasks } from "@/services/collection";
import { ICollection, TaskStatus } from "@/types/base";
import { formatEstimated } from "@/utils/base";
import {
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
      className="group bg-card flex h-[303px] cursor-pointer flex-col rounded-xl border border-[#363636] p-6 transition-all hover:border-[#525252]"
    >
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#363636]">
            <IconBrandNotion className="text-atext-500 h-5 w-5" />
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

      <div className="mt-4 flex items-center justify-between border-t border-[#363636] pt-4">
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
