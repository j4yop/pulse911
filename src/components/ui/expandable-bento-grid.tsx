'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useOutsideClick } from '@/hooks/use-outside-click'
import { X, ArrowRight, ExternalLink, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export type BentoItemAccent = 'rose' | 'indigo' | 'amber' | 'slate' | 'emerald' | 'blue'

export interface BentoGridItem {
  id: string | number
  title: string
  subtitle?: string
  description?: string
  content: React.ReactNode
  icon?: React.ReactNode
  className?: string
  badge?: string
  accent?: BentoItemAccent
  ctaText?: string
  ctaHref?: string
  onCtaClick?: () => void
}

export interface BentoGridProps {
  items: BentoGridItem[]
  className?: string
  gridClassName?: string
}

const ACCENT_STYLES: Record<
  BentoItemAccent,
  {
    iconBg: string
    badge: string
    cardBg: string
    cardBorder: string
    bannerGradient: string
    buttonBg: string
  }
> = {
  rose: {
    iconBg: 'bg-rose-50 text-rose-600 border-rose-200/80',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    cardBg: 'bg-rose-50/40 hover:bg-rose-50/70',
    cardBorder: 'border-rose-200/70 hover:border-rose-300',
    bannerGradient: 'from-rose-50 via-slate-50 to-rose-100/50',
    buttonBg: 'bg-rose-600 hover:bg-rose-700 text-white',
  },
  indigo: {
    iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200/80',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    cardBg: 'bg-indigo-50/40 hover:bg-indigo-50/70',
    cardBorder: 'border-indigo-200/70 hover:border-indigo-300',
    bannerGradient: 'from-indigo-50 via-slate-50 to-indigo-100/50',
    buttonBg: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-600 border-amber-200/80',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    cardBg: 'bg-amber-50/40 hover:bg-amber-50/70',
    cardBorder: 'border-amber-200/70 hover:border-amber-300',
    bannerGradient: 'from-amber-50 via-slate-50 to-amber-100/50',
    buttonBg: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  slate: {
    iconBg: 'bg-slate-100 text-slate-800 border-slate-200',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    cardBg: 'bg-slate-50/60 hover:bg-slate-100/80',
    cardBorder: 'border-slate-200/90 hover:border-slate-300',
    bannerGradient: 'from-slate-100 via-slate-50 to-slate-200/50',
    buttonBg: 'bg-slate-900 hover:bg-slate-800 text-white',
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cardBg: 'bg-emerald-50/40 hover:bg-emerald-50/70',
    cardBorder: 'border-emerald-200/70 hover:border-emerald-300',
    bannerGradient: 'from-emerald-50 via-slate-50 to-emerald-100/50',
    buttonBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  blue: {
    iconBg: 'bg-blue-50 text-blue-600 border-blue-200/80',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    cardBg: 'bg-blue-50/40 hover:bg-blue-50/70',
    cardBorder: 'border-blue-200/70 hover:border-blue-300',
    bannerGradient: 'from-blue-50 via-slate-50 to-blue-100/50',
    buttonBg: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
}

export function ExpandableBentoGrid({ items, className, gridClassName }: BentoGridProps) {
  const [active, setActive] = useState<BentoGridItem | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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

  const activeAccent = active?.accent ? ACCENT_STYLES[active.accent] : ACCENT_STYLES.slate

  return (
    <div className={cn("w-full", className)}>
      {/* Modal & Backdrop Rendered Via Portal To Break Out Of Any CSS Containing Blocks */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <AnimatePresence>
            {active && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActive(null)}
                className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm h-full w-full z-[10000] cursor-pointer"
              />
            )}
          </AnimatePresence>

          {/* Expanded Modal */}
          <AnimatePresence>
            {active ? (
              <div
                className="fixed inset-0 z-[10001] grid place-items-center p-4 sm:p-6 overflow-y-auto"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setActive(null)
                  }
                }}
              >
                <motion.div
                  layoutId={`card-${active.title}-${id}`}
                  ref={ref}
                  className="relative w-full max-w-[620px] bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200/90 flex flex-col my-auto"
                >
                  {/* Close Button */}
                  <button
                    type="button"
                    className="absolute top-4 right-4 z-30 flex items-center justify-center bg-white/95 hover:bg-white rounded-full h-8 w-8 text-slate-700 hover:text-slate-950 transition-all shadow-sm border border-slate-200 cursor-pointer active:scale-95"
                    onClick={() => setActive(null)}
                    aria-label="Close dialog"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  {/* Top Banner / Icon Stage */}
                  <motion.div layoutId={`image-${active.title}-${id}`}>
                    <div
                      className={cn(
                        "w-full h-36 sm:h-44 bg-gradient-to-br border-b border-slate-200/80 flex flex-col items-center justify-center relative overflow-hidden",
                        activeAccent.bannerGradient
                      )}
                    >
                      {/* Subtle Grid Backdrop */}
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                      {active.badge && (
                        <span
                          className={cn(
                            "absolute top-4 left-4 z-10 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border shadow-2xs",
                            activeAccent.badge
                          )}
                        >
                          {active.badge}
                        </span>
                      )}

                      {/* Centered Large Icon Stage */}
                      <div className="relative z-10 p-4 rounded-2xl bg-white shadow-md border border-slate-200/90 scale-125 transform-3d">
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
                          className="font-black text-xl text-slate-900 tracking-tight font-sans"
                        >
                          {active.title}
                        </motion.h3>
                        {active.subtitle && (
                          <p className="text-xs font-mono font-bold text-slate-500">
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
                              className={cn(
                                "w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold font-mono rounded-xl transition-all shadow-xs cursor-pointer active:scale-95",
                                activeAccent.buttonBg
                              )}
                            >
                              <span>{active.ctaText || 'Open Artifact'}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <a
                              href={active.ctaHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold font-mono rounded-xl transition-all shadow-xs active:scale-95",
                                activeAccent.buttonBg
                              )}
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
                        className="mt-3 text-slate-600 text-xs sm:text-sm leading-relaxed"
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
                      className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 max-h-[300px] overflow-y-auto text-xs text-slate-600 font-sans [scrollbar-width:thin]"
                    >
                      {active.content}
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            ) : null}
          </AnimatePresence>
        </>,
        document.body
      )}

      {/* Grid of Bento Cards */}
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", gridClassName)}>
        {items.map((item) => {
          const accent = item.accent ? ACCENT_STYLES[item.accent] : ACCENT_STYLES.slate

          return (
            <motion.div
              layoutId={`card-${item.title}-${id}`}
              key={item.id}
              onClick={() => setActive(item)}
              whileHover={{ y: -3, transition: { duration: 0.18 } }}
              className={cn(
                "group relative p-4 rounded-2xl cursor-pointer transition-all duration-200 flex flex-col justify-between gap-4 text-left border shadow-2xs hover:shadow-md",
                accent.cardBg,
                accent.cardBorder,
                item.className
              )}
            >
              {/* Card Top: Icon & Badge */}
              <div className="flex items-start justify-between gap-2">
                <motion.div layoutId={`image-${item.title}-${id}`}>
                  <div
                    className={cn(
                      "h-12 w-12 rounded-xl border flex items-center justify-center p-2.5 shadow-2xs group-hover:scale-105 transition-transform bg-white",
                      accent.iconBg
                    )}
                  >
                    {item.icon}
                  </div>
                </motion.div>

                {item.badge && (
                  <span
                    className={cn(
                      "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border shadow-2xs shrink-0",
                      accent.badge
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Card Middle: Title & Subtitle */}
              <div className="space-y-1">
                <motion.h4
                  layoutId={`title-${item.title}-${id}`}
                  className="font-bold text-slate-900 text-sm font-sans tracking-tight leading-snug group-hover:text-slate-950"
                >
                  {item.title}
                </motion.h4>
                {item.subtitle && (
                  <motion.p
                    layoutId={`description-${item.title}-${id}`}
                    className="text-slate-500 text-xs font-mono line-clamp-1"
                  >
                    {item.subtitle}
                  </motion.p>
                )}
              </div>

              {/* Card Footer: Interactive Cue */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-[11px] font-mono text-slate-400 group-hover:text-slate-700 transition-colors">
                <span className="text-[10px] font-bold">Inspect Spec</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default ExpandableBentoGrid
