import { cn } from "@/lib/utils";
import { IconGridScan, IconPlus } from "@tabler/icons-react";
import { useState } from "react";

interface ISidebarProps {
  onCreateCollection: () => void;
}
export default function Sidebar({ onCreateCollection }: ISidebarProps) {
  const [showArchived, setShowArchived] = useState(false);

  return (
    <aside className="mt-4 flex shrink-0 flex-col gap-2">
      <button
        onClick={onCreateCollection}
        className="text-atext-500 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-opacity hover:opacity-90"
      >
        <IconPlus className="text-atext-450 h-5 w-5" />
        Create new list
      </button>

      <button
        onClick={() => setShowArchived(false)}
        className={cn(
          "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
          !showArchived
            ? "text-atext-500 bg-[#262626]"
            : "text-atext-460 hover:bg-[#262626] hover:text-atext-500",
        )}
      >
        <IconGridScan className="text-atext-450 h-5 w-5" />
        All my lists
      </button>
    </aside>
  );
}
