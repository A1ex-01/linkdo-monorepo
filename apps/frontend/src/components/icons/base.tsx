import { cn } from "@/lib/utils";
import { IconPlugConnected } from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { ImgHTMLAttributes } from "react";

interface IProps extends ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}
export function AIconClickup({ className }: IProps) {
  return (
    <img
      src="/clickup-logo.svg"
      alt=""
      className={cn("size-5 rounded bg-white", className)}
    />
  );
}

export function AIconNotion({ className }: IProps) {
  return (
    <img
      src="/notion-brand-logo.svg"
      alt=""
      className={cn("size-5 rounded", className)}
    />
  );
}

export function AIconMCP({ className }: IProps) {
  return (
    <IconPlugConnected
      className={cn("bg-card text-foreground size-5 rounded p-1", className)}
    />
  );
}

export function AIconFigma({ className }: IProps) {
  return (
    <img
      src="/figma-logo.svg"
      alt=""
      className={cn("bg-card size-5 rounded p-1", className)}
    />
  );
}

export function AIconLinkdo({ className }: IProps) {
  const { theme } = useTheme();
  return (
    <img
      src={theme === "dark" ? "/linkdo-dark.png" : "/linkdo.png"}
      alt=""
      className={cn("size-5", className)}
    />
  );
}
