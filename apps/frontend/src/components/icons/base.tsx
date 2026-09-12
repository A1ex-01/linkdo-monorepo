import { cn } from "@/lib/utils";
import { IconPlugConnected } from "@tabler/icons-react";
import { ImgHTMLAttributes } from "react";

interface IProps extends ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}
export function AIconClickup({ className }: IProps) {
  return (
    <img
      src="/clickup-logo.svg"
      alt=""
      className={cn("size-5 rounded bg-card", className)}
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
      className={cn("size-5 rounded bg-card p-1 text-foreground", className)}
    />
  );
}

export function AIconFigma({ className }: IProps) {
  return (
    <img
      src="/figma-logo.svg"
      alt=""
      className={cn("size-5 rounded bg-card p-1", className)}
    />
  );
}
