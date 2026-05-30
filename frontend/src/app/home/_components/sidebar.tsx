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
        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-atext-500 transition-opacity hover:opacity-90"
      >
        <IconPlus className="h-5 w-5 text-atext-450" />
        Create new list
      </button>

      <button
        onClick={() => setShowArchived(false)}
        className={cn(
          "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
          !showArchived
            ? "bg-[#EEF2FF] text-atext-500"
            : "text-[#988d9f] hover:bg-[#262626] hover:text-white",
        )}
      >
        <IconGridScan className="h-5 w-5 text-atext-450" />
        All my lists
      </button>
    </aside>
  );
}
