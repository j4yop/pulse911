"use client";

import React, { useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface DockItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  onClick?: () => void;
  isActive?: boolean;
  badge?: string;
  accent?: string;
}

export interface GlassDockProps {
  items: DockItem[];
  className?: string;
  dockClassName?: string;
}

export function GlassDock({ items, className, dockClassName }: GlassDockProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className={cn("w-full max-w-full flex items-center justify-center relative", className)}
    >
      <div
        className={cn(
          "relative flex items-center gap-1.5 sm:gap-3 px-3 sm:px-6 py-2.5 sm:py-3 rounded-2xl sm:rounded-full",
          "bg-white/85 dark:bg-neutral-900/85 backdrop-blur-xl border border-white/90 dark:border-neutral-800",
          "shadow-[0_10px_35px_-5px_rgba(15,23,42,0.12),0_0_0_1px_rgba(255,255,255,0.8)_inset]",
          // Mobile: horizontal swipe rail (8 controls never fit a phone width).
          "max-w-full overflow-x-auto no-scrollbar overscroll-x-contain",
          dockClassName
        )}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* Animated Tooltip */}
        <AnimatePresence>
          {hoveredIndex !== null && items[hoveredIndex] && (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: -45 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none z-30"
            >
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-950 text-white text-xs font-mono font-bold shadow-lg border border-slate-800 flex items-center gap-1.5 whitespace-nowrap">
                <span>{items[hoveredIndex].title}</span>
                {items[hoveredIndex].subtitle && (
                  <span className="text-[10px] text-slate-400 font-normal">
                    &bull; {items[hoveredIndex].subtitle}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {items.map((item, index) => {
          const Icon = item.icon;
          const isHovered = hoveredIndex === index;
          const isActive = item.isActive;

          return (
            <motion.button
              key={item.id}
              type="button"
              onMouseEnter={() => setHoveredIndex(index)}
              onClick={item.onClick}
              whileTap={{ scale: 0.92 }}
              animate={{
                scale: isHovered ? 1.15 : isActive ? 1.05 : 1,
                y: isHovered ? -3 : 0,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={cn(
                "relative shrink-0 p-2 sm:p-3 rounded-xl sm:rounded-full transition-all cursor-pointer flex items-center justify-center group touch-manipulation",
                isActive
                  ? "bg-rose-600 text-white shadow-md shadow-rose-500/25 ring-2 ring-rose-500/20"
                  : "bg-slate-100/80 hover:bg-slate-200/90 text-slate-700 hover:text-slate-950 dark:bg-neutral-800 dark:text-neutral-300"
              )}
              aria-label={item.title}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 transition-transform" />

              {/* Pulsing Dot on Active Item */}
              {isActive && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default GlassDock;
