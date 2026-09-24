"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children?: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <div
      className={cn(
        "relative flex flex-col min-h-screen w-full bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-100 transition-colors duration-500",
        className
      )}
      {...props}
    >
      {/* Luminous Animated Aurora Wave Layer */}
      <div
        className={cn(
          "fixed inset-0 overflow-hidden pointer-events-none z-0",
          showRadialGradient &&
            "[mask-image:radial-gradient(ellipse_at_50%_0%,black_40%,transparent_85%)] [-webkit-mask-image:radial-gradient(ellipse_at_50%_0%,black_40%,transparent_85%)]"
        )}
      >
        <div
          className={cn(
            `
          [--aurora:repeating-linear-gradient(100deg,rgba(56,189,248,0.7)_10%,rgba(129,140,248,0.6)_16%,rgba(96,165,250,0.7)_22%,rgba(192,132,252,0.6)_28%,rgba(52,211,153,0.6)_34%,rgba(56,189,248,0.7)_40%)]
          [background-image:var(--aurora)]
          [background-size:300%,_200%]
          [background-position:50%_50%]
          filter blur-[32px]
          after:content-[""] after:absolute after:inset-0
          after:[background-image:var(--aurora)]
          after:[background-size:200%,_150%]
          after:animate-aurora
          pointer-events-none
          absolute -inset-[20px] opacity-45 dark:opacity-30 will-change-transform`
          )}
        ></div>
      </div>

      <div className="relative z-10 w-full flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default AuroraBackground;
