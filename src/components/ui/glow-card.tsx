import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type GlowColor =
  | "blue"
  | "purple"
  | "green"
  | "emerald"
  | "red"
  | "rose"
  | "orange"
  | "amber"
  | "indigo";

const GLOW_COLOR_MAP: Record<GlowColor, { base: number; spread: number }> = {
  blue: { base: 220, spread: 200 },
  purple: { base: 280, spread: 300 },
  green: { base: 120, spread: 200 },
  emerald: { base: 155, spread: 200 },
  red: { base: 0, spread: 200 },
  rose: { base: 345, spread: 200 },
  orange: { base: 30, spread: 200 },
  amber: { base: 38, spread: 180 },
  indigo: { base: 235, spread: 220 },
};

export interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowColor?: GlowColor;
  className?: string;
  radius?: number;
}

export const GlowCard: React.FC<GlowCardProps> = ({
  children,
  className = "",
  glowColor = "blue",
  radius = 24,
  style,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePointerMove = (e: PointerEvent) => {
      const { clientX, clientY } = e;
      if (cardRef.current) {
        cardRef.current.style.setProperty("--x", clientX.toFixed(2));
        cardRef.current.style.setProperty(
          "--xp",
          (clientX / window.innerWidth).toFixed(2)
        );
        cardRef.current.style.setProperty("--y", clientY.toFixed(2));
        cardRef.current.style.setProperty(
          "--yp",
          (clientY / window.innerHeight).toFixed(2)
        );
      }
    };

    document.addEventListener("pointermove", handlePointerMove);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  const colorConfig = GLOW_COLOR_MAP[glowColor] || GLOW_COLOR_MAP.blue;
  const { base, spread } = colorConfig;

  const cardStyle: React.CSSProperties & Record<string, any> = {
    "--base": base,
    "--spread": spread,
    "--radius": radius.toString(),
    "--border": "1.5",
    "--backdrop": "rgba(255, 255, 255, 0.94)",
    "--backup-border": "rgba(226, 232, 240, 0.9)",
    "--size": "260",
    "--outer": "1",
    "--border-size": "calc(var(--border, 1.5) * 1px)",
    "--spotlight-size": "calc(var(--size, 260) * 1px)",
    "--x": "-1000",
    "--y": "-1000",
    "--xp": "0.5",
    "--yp": "0.5",
    "--hue": "calc(var(--base) + (var(--xp, 0.5) * var(--spread, 0)))",
    backgroundImage: `radial-gradient(
      var(--spotlight-size) var(--spotlight-size) at
      calc(var(--x, -1000) * 1px)
      calc(var(--y, -1000) * 1px),
      hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 70) * 1%) / var(--bg-spot-opacity, 0.15)),
      transparent
    )`,
    backgroundColor: "var(--backdrop, rgba(255, 255, 255, 0.94))",
    backgroundSize: "calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)))",
    backgroundPosition: "50% 50%",
    backgroundAttachment: "fixed",
    border: "var(--border-size) solid var(--backup-border)",
    position: "relative",
    touchAction: "none",
    ...style,
  };

  return (
    <>
      <style>{`
        .glow-card-container [data-glow]::before,
        .glow-card-container [data-glow]::after {
          pointer-events: none;
          content: "";
          position: absolute;
          inset: calc(var(--border-size) * -1);
          border: var(--border-size) solid transparent;
          border-radius: calc(var(--radius) * 1px);
          background-attachment: fixed;
          background-size: calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)));
          background-repeat: no-repeat;
          background-position: 50% 50%;
          mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
          mask-clip: padding-box, border-box;
          mask-composite: intersect;
          -webkit-mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
          -webkit-mask-clip: padding-box, border-box;
          -webkit-mask-composite: source-in, xor;
        }

        .glow-card-container [data-glow]::before {
          background-image: radial-gradient(
            calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75) at
            calc(var(--x, 0) * 1px)
            calc(var(--y, 0) * 1px),
            hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 50) * 1%) / var(--border-spot-opacity, 1)),
            transparent 100%
          );
          filter: brightness(2);
          z-index: 2;
        }

        .glow-card-container [data-glow]::after {
          background-image: radial-gradient(
            calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5) at
            calc(var(--x, 0) * 1px)
            calc(var(--y, 0) * 1px),
            hsl(0 100% 100% / var(--border-light-opacity, 1)),
            transparent 100%
          );
          z-index: 2;
        }

        .glow-card-container [data-glow] > [data-glow] {
          position: absolute;
          inset: 0;
          will-change: filter;
          opacity: var(--outer, 1);
          border-radius: calc(var(--radius) * 1px);
          border-width: calc(var(--border-size) * 20);
          filter: blur(calc(var(--border-size) * 10));
          background: none;
          pointer-events: none;
          border: none;
          z-index: 1;
        }

        .glow-card-container [data-glow] > [data-glow]::before {
          inset: -10px;
          border-width: 10px;
        }
      `}</style>
      <div
        ref={cardRef}
        data-glow
        style={cardStyle}
        className={cn(
          "glow-card-container rounded-3xl relative flex flex-col shadow-sm hover:shadow-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1",
          className
        )}
        {...props}
      >
        <div ref={innerRef} data-glow />
        <div className="relative z-10 w-full h-full flex flex-col">
          {children}
        </div>
      </div>
    </>
  );
};

export default GlowCard;
