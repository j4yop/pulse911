"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon } from "lucide-react";
import { Mockup, MockupFrame } from "@/components/ui/mockup";
import { Glow } from "@/components/ui/glow";
import Image from "next/image";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

import { AsciiGlitchRipple } from "@/components/ui/ascii-glitch-ripple";

interface HeroAction {
  text: string;
  href: string;
  icon?: React.ReactNode;
  variant?: "default" | "glow";
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
}

export function HeroSection({
  badge,
  title,
  description,
  actions,
  image,
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
        "pt-4 sm:pt-6 md:pt-8 pb-10 sm:pb-16 px-4",
        "fade-bottom overflow-hidden pb-0"
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-8 sm:gap-12">
        <div className="flex flex-col items-center gap-6 text-center sm:gap-10">
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
          <h1 className="relative z-10 inline-block animate-appear text-4xl font-black tracking-tight text-slate-900 drop-shadow-xs sm:text-6xl sm:leading-tight md:text-7xl md:leading-tight max-w-4xl">
            {title}
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-lg relative z-10 max-w-[680px] animate-appear font-normal text-muted-foreground delay-100 leading-relaxed">
            {description}
          </p>

          {/* Actions */}
          <div className="relative z-10 flex animate-appear justify-center gap-4 delay-300">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant}
                size="lg"
                asChild
                className="rounded-xl shadow-xs"
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

          {/* Image with Glow */}
          <div className="relative pt-8 sm:pt-12 w-full max-w-5xl mx-auto">
            <MockupFrame
              className="animate-appear delay-700 border border-slate-200/90 shadow-2xl bg-white/50 backdrop-blur-sm"
              size="small"
            >
              <Mockup type="responsive">
                <Image
                  src={imageSrc}
                  alt={image.alt}
                  width={1248}
                  height={765}
                  priority
                  className="w-full h-auto rounded-lg object-cover"
                />
              </Mockup>
            </MockupFrame>
            <Glow
              variant="top"
              className="animate-appear-zoom delay-1000"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
