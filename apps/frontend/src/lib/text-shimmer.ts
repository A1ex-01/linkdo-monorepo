import type { CSSProperties } from "react";

export const TEXT_SHIMMER_KEYFRAMES =
  "@keyframes beui-text-shimmer{from{background-position:200% 0}to{background-position:-200% 0}}";

export const TEXT_SHIMMER_CLASS_NAME = "text-shimmer";

export function textShimmerStyle(duration: number): CSSProperties {
  return {
    animation: `beui-text-shimmer ${duration}s linear infinite`,
  };
}
