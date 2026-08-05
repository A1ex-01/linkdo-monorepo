import { ICollection } from "@/types/base";
import { formatEstimated } from "@/utils/base";
import { IconBrandNotion, IconDotsVertical } from "@tabler/icons-react";

interface ICollectionCardProps {
  collection: ICollection;
  onClick: () => void;
}
export default function CollectionCard({
  collection,
  onClick,
}: ICollectionCardProps) {
  const estimated = formatEstimated(collection.estimated_total);

  return (
    <div
      onClick={onClick}
      className="group flex h-[303px] cursor-pointer flex-col rounded-xl border border-[#363636] bg-card p-6 transition-all hover:border-[#525252]"
    >
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-[#363636]">
            <IconBrandNotion className="text-atext-500 h-5 w-5" />
          </div>
          <h3 className="text-atext-500 font-medium">{collection.name}</h3>
        </div>
        <button
          className="opacity-0 transition-opacity group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <IconDotsVertical className="text-atext-460 h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="text-atext-400 text-sm">No tasks yet</p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[#363636] pt-4">
        <span className="text-atext-450 text-xs font-bold tracking-wide uppercase">
          {collection.pending_count} pending tasks
        </span>
        {estimated && (
          <span className="bg-muted rounded px-2 py-1 text-xs text-atext-460">
            Est: {estimated}
          </span>
        )}
      </div>
    </div>
  );
}
