import { cn } from "@/lib/utils";
import { IconAnalyze, IconChartArcs, IconChartBar, IconHome, IconReport } from "@tabler/icons-react";
import { useRouter } from "next/navigation";

export default function BottomNav({
  active = "home",
}: {
  active?: "home" | "reports";
}) {
  const router = useRouter();
  return (
    <nav className="flex h-16 w-full items-center justify-between overflow-hidden rounded-b-2xl border-t border-[rgba(77,67,84,0.2)] bg-[rgba(14,14,14,0.95)] px-8 backdrop-blur-[12px]">
      <div className="flex items-center gap-2">
        <button
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors text-[#988d9f] hover:text-white bg-transparent hover:bg-accent",
            
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
            "flex items-center gap-2.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors text-[#988d9f] hover:text-white bg-transparent hover:bg-accent",
          
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
        <span className="text-xs text-[#6b7280]">Link-Do</span>
        <img src="/logo.png" alt="avatar" className="w-8 h-8 rounded-md opacity-80" />
      </div>
    </nav>
  );
}
