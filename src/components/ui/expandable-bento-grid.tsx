'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useOutsideClick } from '@/hooks/use-outside-click'
import { X, ArrowRight, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BentoGridItem {
  id: string | number
  title: string
  subtitle?: string
  description?: string
  content: React.ReactNode
  icon?: React.ReactNode
  className?: string
  accentColor?: string
  ctaText?: string
  ctaHref?: string
  onCtaClick?: () => void
  badge?: string
}

export interface BentoGridProps {
  items: BentoGridItem[]
  className?: string
  gridClassName?: string
}

export function ExpandableBentoGrid({ items, className, gridClassName }: BentoGridProps) {
  const [active, setActive] = useState<BentoGridItem | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActive(null)
      }
    }

    if (active) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = 'auto'
    }
  }, [active])

  useOutsideClick(ref, () => setActive(null))

  return (
    <div className={cn("w-full", className)}>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs h-full w-full z-[10000]"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {active ? (
          <div className="fixed inset-0 grid place-items-center z-[10001] p-4 sm:p-6 overflow-y-auto">
            <motion.div
              layoutId={`card-${active.title}-${id}`}
              ref={ref}
              className="relative w-full max-w-[620px] bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-neutral-800 flex flex-col my-auto"
            >
              {/* Close Button */}
              <button
                type="button"
                className="absolute top-4 right-4 z-20 flex items-center justify-center bg-slate-900/10 hover:bg-slate-900/20 dark:bg-white/10 dark:hover:bg-white/20 rounded-full h-8 w-8 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                onClick={() => setActive(null)}
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Top Banner / Icon Stage */}
              <motion.div layoutId={`image-${active.title}-${id}`}>
                <div className="w-full h-36 sm:h-44 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 dark:from-neutral-900 dark:via-neutral-950 dark:to-neutral-900 border-b border-slate-200/80 dark:border-neutral-800 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f080_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f080_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b40_1px,transparent_1px),linear-gradient(to_bottom,#1e293b40_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
                  
                  {active.badge && (
                    <span className="absolute top-4 left-4 z-10 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-slate-300 shadow-2xs">
                      {active.badge}
                    </span>
                  )}

                  <div className="relative z-10 scale-125 p-4 rounded-2xl bg-white dark:bg-neutral-800 shadow-md border border-slate-200/90 dark:border-neutral-700 text-slate-900 dark:text-white">
                    {active.icon}
                  </div>
                </div>
              </motion.div>

              {/* Title & Description Header */}
              <div className="p-6 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <motion.h3
                      layoutId={`title-${active.title}-${id}`}
                      className="font-black text-xl text-slate-900 dark:text-neutral-100 tracking-tight"
                    >
                      {active.title}
                    </motion.h3>
                    {active.subtitle && (
                      <p className="text-xs font-mono font-bold text-slate-500 dark:text-neutral-400">
                        {active.subtitle}
                      </p>
                    )}
                  </div>

                  {/* Primary CTA Button */}
                  {(active.onCtaClick || active.ctaHref) && (
                    <motion.div layoutId={`button-${active.title}-${id}`} className="shrink-0">
                      {active.onCtaClick ? (
                        <button
                          type="button"
                          onClick={() => {
                            const handler = active.onCtaClick
                            setActive(null)
                            handler?.()
                          }}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold font-mono rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
                        >
                          <span>{active.ctaText || 'Open Artifact'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <a
                          href={active.ctaHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold font-mono rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 transition-colors shadow-xs"
                        >
                          <span>{active.ctaText || 'Visit'}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </motion.div>
                  )}
                </div>

                {active.description && (
                  <motion.p
                    layoutId={`description-${active.title}-${id}`}
                    className="mt-3 text-slate-600 dark:text-neutral-400 text-xs sm:text-sm leading-relaxed"
                  >
                    {active.description}
                  </motion.p>
                )}
              </div>

              {/* Expandable Rich Content Section */}
              <div className="px-6 pb-6 pt-2">
                <motion.div
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl bg-slate-50 dark:bg-neutral-950/70 border border-slate-200/80 dark:border-neutral-800 p-4 max-h-[320px] overflow-y-auto text-xs text-slate-600 dark:text-neutral-400 font-sans"
                >
                  {active.content}
                </motion.div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {/* Grid of Bento Cards */}
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", gridClassName)}>
        {items.map((item) => (
          <motion.div
            layoutId={`card-${item.title}-${id}`}
            key={item.id}
            onClick={() => setActive(item)}
            className={cn(
              "group relative p-4 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between gap-3 text-left",
              "bg-slate-50/90 hover:bg-slate-100/90 dark:bg-neutral-900/60 dark:hover:bg-neutral-800/80",
              "border border-slate-200/90 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700",
              "shadow-2xs hover:shadow-xs",
              item.className
            )}
          >
            <div className="flex items-center gap-3">
              <motion.div layoutId={`image-${item.title}-${id}`}>
                <div className="h-10 w-10 rounded-xl bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 flex items-center justify-center text-slate-800 dark:text-slate-200 p-2 shadow-2xs group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>
              </motion.div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <motion.h4
                    layoutId={`title-${item.title}-${id}`}
                    className="font-bold text-slate-900 dark:text-neutral-100 text-sm truncate font-sans"
                  >
                    {item.title}
                  </motion.h4>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
                {item.subtitle && (
                  <motion.p
                    layoutId={`description-${item.title}-${id}`}
                    className="text-slate-500 dark:text-neutral-400 text-[11px] truncate font-sans"
                  >
                    {item.subtitle}
                  </motion.p>
                )}
              </div>
            </div>

            {item.badge && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-neutral-800/80 text-[11px] font-mono">
                <span className="truncate text-slate-500 dark:text-neutral-400 font-medium">{item.badge}</span>
                <span className="text-[10px] text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 font-bold transition-colors shrink-0 flex items-center gap-0.5">
                  Details &rarr;
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default ExpandableBentoGrid
