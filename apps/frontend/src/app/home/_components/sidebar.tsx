import { Button } from "@/components/ui/button";
import { IconChartBar, IconGridScan, IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ISidebarProps {
  onCreateCollection: () => void;
}
export default function Sidebar({ onCreateCollection }: ISidebarProps) {
  const [showArchived, setShowArchived] = useState(false);
  const router = useRouter();

  return (
    <aside className="mt-4 flex shrink-0 flex-col gap-2">
      <Button
        onClick={onCreateCollection}
        variant={"outline"}
        size={"lg"}
        // className="text-atext-500 hover:bg-muted-foreground flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-opacity hover:opacity-80"
      >
        <IconPlus className="h-5 w-5" />
        Create new list
      </Button>

      <Button onClick={() => setShowArchived(false)} size={"lg"}>
        <IconGridScan className="h-5 w-5" />
        All my lists
      </Button>

      <Button
        onClick={() => router.push("/reports")}
        size={"lg"}
        variant={"secondary"}
      >
        <IconChartBar className="h-5 w-5" />
        Reports
      </Button>
    </aside>
  );
}
