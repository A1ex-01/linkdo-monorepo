"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import React, { useEffect, useState } from "react";

interface IconTransitionProps {
  /** The icons or arbitrary DOM nodes to present in order. */
  items: React.ReactNode[];
  /** How long each item remains the focal icon, in milliseconds. */
  itemDuration?: number;
  /** Repeat the sequence after the final item. */
  loop?: boolean;
  /** Called after the final item has been held when `loop` is false. */
  onComplete?: () => void;
  className?: string;
}

export function IconTransition({
  items,
  itemDuration = 900,
  loop = true,
  onComplete,
  className,
}: IconTransitionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;
  const itemCount = items.length;
  const activeItem = items[activeIndex] ?? null;

  useEffect(() => {
    if (hasCompleted) return;

    if (itemCount < 2) {
      if (!loop) {
        setHasCompleted(true);
        onComplete?.();
      }
      return;
    }

    const timer = window.setTimeout(() => {
      if (activeIndex === itemCount - 1) {
        if (loop) {
          setActiveIndex(0);
        } else {
          setHasCompleted(true);
          onComplete?.();
        }
        return;
      }
      setActiveIndex((index) => index + 1);
    }, itemDuration);

    return () => window.clearTimeout(timer);
  }, [activeIndex, hasCompleted, itemCount, itemDuration, loop, onComplete]);

  if (!activeItem) return null;

  return (
    <span
      aria-live={loop ? "off" : "polite"}
      className={cn("relative inline-grid place-items-center", className)}
      style={{ perspective: 520 }}
    >
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={activeIndex}
          className="absolute inline-grid place-items-center will-change-transform"
          style={{
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
          }}
          initial={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, x: 20, y: -8, scale: 0.78, rotate: 5 }
          }
          animate={
            reduceMotion
              ? { opacity: 1 }
              : {
                  opacity: 1,
                  x: 0,
                  y: 0,
                  scale: 1,
                  rotate: 0,
                  zIndex: 2,
                }
          }
          exit={
            reduceMotion
              ? { opacity: 0 }
              : {
                  // The card keeps its full size for one complete icon width.
                  // The depth fold starts only after that leftward travel.
                  opacity: [1, 1, 1, 1, 0.7, 0],
                  x: [0, 8, -18, -64, -94, -124],
                  y: [0, 0, 0, 0, 6, 14],
                  scale: [1, 1, 1, 1, 0.74, 0.36],
                  rotateY: [0, 0, 0, 0, -28, -62],
                  z: [0, 0, 0, 0, -34, -82],
                  zIndex: [2, 2, 2, 2, 1, 0],
                  transition: {
                    duration: 0.64,
                    times: [0, 0.12, 0.32, 0.58, 0.8, 1],
                    ease: [0.45, 0, 0.2, 1],
                  },
                }
          }
          transition={{
            // The next card starts during the final 100ms of the old card's
            // 640ms exit, keeping the handoff connected without overlapping
            // the main leftward travel.
            delay: reduceMotion ? 0 : 0.34,
            duration: reduceMotion ? 0.15 : 0.42,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {activeItem}
        </motion.div>
      </AnimatePresence>
    </span>
  );
}
