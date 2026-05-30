import { cn } from "@/lib/utils";
import { IconHome, IconReport } from "@tabler/icons-react";

export default function BottomNav({
  active = "home",
}: {
  active?: "home" | "reports";
}) {
  return (
    <nav className="flex h-16 w-full items-center justify-between overflow-hidden rounded-b-2xl border-t border-[rgba(77,67,84,0.2)] bg-[rgba(14,14,14,0.95)] px-8 backdrop-blur-[12px]">
      <div className="flex items-center gap-2">
        <button
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
            active === "home"
              ? "bg-[#2a2a2b] text-white"
              : "text-[#988d9f] hover:text-white",
          )}
        >
          <IconHome />
          Home
        </button>
        <button
          className={cn(
            "flex items-center gap-2.5 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
            active === "reports"
              ? "bg-[#2a2a2b] text-white"
              : "text-[#988d9f] hover:text-white",
          )}
        >
          <IconReport />
          Reports
        </button>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs text-[#6b7280]">Link-Do</span>
        <div className="h-5 w-px bg-[rgba(77,67,84,0.3)]" />
        <button className="text-[#6b7280] transition-colors hover:text-white">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle
              cx="9"
              cy="9"
              r="7.5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M7.5 7C7.5 6.17157 8.17157 5.5 9 5.5C9.82843 5.5 10.5 6.17157 10.5 7C10.5 7.82843 9.82843 8.5 9 8.5C8.17157 8.5 7.5 7.82843 7.5 7Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M7.5 12C6.67157 12 6 11.3284 6 10.5C6 9.67157 6.67157 9 7.5 9C8.32843 9 9 9.67157 9 10.5C9 11.3284 8.32843 12 7.5 12Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        </button>
      </div>
    </nav>
  );
}
