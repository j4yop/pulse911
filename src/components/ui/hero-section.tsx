"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon } from "lucide-react";
import { Glow } from "@/components/ui/glow";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { AsciiGlitchRipple } from "@/components/ui/ascii-glitch-ripple";

interface HeroAction {
  text: string;
  href: string;
  icon?: React.ReactNode;
  variant?: "default" | "glow" | "outline" | "secondary" | "ghost";
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

interface HeroProps {
  badge?: {
    text: string;
    action: {
      text: string;
      href: string;
      onClick?: (e: React.MouseEvent) => void;
    };
  };
  title: React.ReactNode;
  description: React.ReactNode;
  actions: HeroAction[];
  image: {
    light: string;
    dark: string;
    alt: string;
  };
  className?: string;
}

export function HeroSection({
  badge,
  title,
  description,
  actions,
  image,
  className,
}: HeroProps) {
  // Safe theme extraction defaulting to light
  let resolvedTheme = "light";
  try {
    const themeCtx = useTheme();
    if (themeCtx?.resolvedTheme) {
      resolvedTheme = themeCtx.resolvedTheme;
    }
  } catch {
    resolvedTheme = "light";
  }

  const imageSrc = resolvedTheme === "dark" ? image.dark : image.light;

  return (
    <section
      className={cn(
        "bg-transparent text-foreground",
        "pt-2 sm:pt-4 pb-2 px-2 sm:px-4",
        "overflow-hidden",
        className
      )}
    >
      <ContainerScroll
        titleComponent={
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 text-center sm:gap-7 mb-6 sm:mb-8">
            {/* Badge */}
            {badge && (
              <Badge variant="outline" className="animate-appear gap-2 py-1.5 px-4 rounded-full border-slate-200/90 bg-white/90 shadow-2xs text-xs">
                <span className="text-muted-foreground">{badge.text}</span>
                <a
                  href={badge.action.href}
                  onClick={badge.action.onClick}
                  className="flex items-center gap-1 font-semibold text-rose-600 hover:text-rose-700 transition-colors"
                >
                  <AsciiGlitchRipple as="span" dur={800} spread={1.0}>
                    {badge.action.text}
                  </AsciiGlitchRipple>
                  <ArrowRightIcon className="h-3 w-3" />
                </a>
              </Badge>
            )}

            {/* Title */}
            <h1 className="relative z-10 inline-block animate-appear text-3xl font-extrabold tracking-tight text-slate-900 drop-shadow-2xs sm:text-5xl sm:leading-[1.14] md:text-6xl md:leading-[1.14] max-w-4xl">
              {title}
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-lg relative z-10 max-w-[680px] animate-appear font-normal text-muted-foreground delay-100 leading-relaxed">
              {description}
            </p>

            {/* Actions */}
            <div className="relative z-10 flex animate-appear justify-center gap-4 delay-300 pb-2 sm:pb-4">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant}
                  size="lg"
                  asChild
                  className={cn("rounded-xl shadow-xs", action.className)}
                >
                  <a
                    href={action.href}
                    onClick={action.onClick}
                    className="flex items-center gap-2 font-bold"
                  >
                    {action.icon}
                    {action.text}
                  </a>
                </Button>
              ))}
            </div>
          </div>
        }
      >
        <div className="relative w-full h-full rounded-xl sm:rounded-2xl overflow-hidden bg-slate-950 flex flex-col justify-center items-center">
          <img
            src={imageSrc}
            alt={image.alt}
            className="w-full h-full object-cover object-top select-none pointer-events-none"
            draggable={false}
          />
          <Glow
            variant="top"
            className="pointer-events-none animate-appear-zoom delay-1000"
          />
        </div>
      </ContainerScroll>
    </section>
  );
}

export default HeroSection;
