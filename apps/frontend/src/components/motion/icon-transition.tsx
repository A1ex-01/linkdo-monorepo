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
    >
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={activeIndex}
          className="absolute inline-grid place-items-center"
          initial={
            reduceMotion ? { opacity: 0 } : { opacity: 0, x: 14, scale: 0.84 }
          }
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={
            reduceMotion ? { opacity: 0 } : { opacity: 0, x: -14, scale: 0.84 }
          }
          transition={{
            duration: reduceMotion ? 0.15 : 0.3,
            ease: [0.65, 0, 0.35, 1],
          }}
        >
          {activeItem}
        </motion.div>
      </AnimatePresence>
    </span>
  );
}
