import { cn } from "@/lib/utils";
import { IconChartBar, IconHome } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { AIconLinkdo } from "./icons/base";

export default function BottomNav({
  active = "home",
}: {
  active?: "home" | "reports";
}) {
  const router = useRouter();
  return (
    <nav className="border-border bg-card/95 flex h-16 w-full items-center justify-between overflow-hidden rounded-b-2xl border-t px-8 backdrop-blur-[12px]">
      <div className="flex items-center gap-2">
        <button
          className={cn(
            "hover:bg-accent text-muted-foreground hover:text-foreground flex items-center gap-2.5 rounded-xl bg-transparent px-4 py-2 text-sm font-medium transition-colors",
          )}
          onClick={() => {
            router.push("/home");
          }}
        >
          <IconHome stroke={1.5} />
          Home
        </button>
        <button
          className={cn(
            "hover:bg-accent text-muted-foreground hover:text-foreground flex items-center gap-2.5 rounded-xl bg-transparent px-4 py-2 text-sm font-medium transition-colors",
          )}
          onClick={() => {
            router.push("/reports");
          }}
        >
          <IconChartBar stroke={1.5} />
          Reports
        </button>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-muted-foreground text-xs">Linkdo</span>
        <AIconLinkdo alt="avatar" className="h-8 w-8 rounded-md opacity-80" />
      </div>
    </nav>
  );
}
