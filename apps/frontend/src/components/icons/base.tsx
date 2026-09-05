import { cn } from "@/lib/utils";
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
