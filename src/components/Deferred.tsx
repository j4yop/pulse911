import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * LazyMount — defers mounting (and therefore parsing/executing) expensive
 * below-the-fold subtrees until they are close to entering the viewport.
 *
 * A placeholder with a reserved min-height is rendered beforehand so the page
 * does not shift when the real content mounts (no layout jank).
 */
export interface LazyMountProps {
  children: React.ReactNode;
  /** Reserved height of the placeholder to avoid layout shift. */
  minHeight?: number;
  /** How far before the viewport to trigger the mount. */
  rootMargin?: string;
  className?: string;
}

export const LazyMount: React.FC<LazyMountProps> = ({
  children,
  minHeight = 320,
  rootMargin = '400px 0px',
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShow(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div
      ref={ref}
      className={className}
      style={show ? undefined : { minHeight }}
      aria-busy={!show}
    >
      {show ? children : null}
    </div>
  );
};

/**
 * ViewSkeleton — lightweight Suspense fallback for lazily imported tabs.
 * Uses pulsing placeholders only (no heavy animation libs) so it paints instantly.
 */
export const ViewSkeleton: React.FC<{ label?: string; compact?: boolean }> = ({
  label = 'Loading module',
  compact = false,
}) => {
  if (compact) {
    return (
      <div className="w-full max-w-3xl mx-auto py-10" aria-hidden="true">
        <div className="h-3 w-40 mx-auto rounded-full bg-slate-200/80 animate-pulse" />
        <div className="mt-4 h-2.5 w-64 mx-auto rounded-full bg-slate-200/60 animate-pulse" />
      </div>
    );
  }

  return (
    <div
      className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-5 animate-pulse"
      role="status"
      aria-label={label}
    >
      <div className="h-8 w-2/3 max-w-md rounded-xl bg-slate-200/80" />
      <div className="h-3 w-1/2 max-w-sm rounded-full bg-slate-200/60" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-slate-200/50" />
        ))}
      </div>
      <div className="h-56 rounded-3xl bg-slate-200/40" />
    </div>
  );
};

/** Placeholder used while a viewports-deferred widget is not yet mounted. */
export const BlockPlaceholder: React.FC<{ className?: string; label?: string }> = ({
  className,
  label,
}) => (
  <div
    className={cn(
      'w-full rounded-3xl border border-slate-200/70 bg-slate-100/50 animate-pulse',
      className
    )}
    aria-label={label}
    aria-hidden={!label}
  />
);

export default LazyMount;