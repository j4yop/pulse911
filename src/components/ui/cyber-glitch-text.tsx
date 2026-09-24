"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const CHARS = "!<>-_\\/[]{}—=+*^?#_0123456789";

interface CyberGlitchTextProps {
  text: string;
  className?: string;
  scrambleOnMount?: boolean;
  scrambleDuration?: number;
}

export function CyberGlitchText({
  text,
  className,
  scrambleOnMount = true,
  scrambleDuration = 35,
}: CyberGlitchTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scramble = () => {
    let iteration = 0;
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setDisplayText(() =>
        text
          .split("")
          .map((letter, index) => {
            if (letter === " ") return " ";
            if (index < iteration) {
              return text[index];
            }
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("")
      );

      if (iteration >= text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }

      iteration += 1 / 2.5;
    }, scrambleDuration);
  };

  useEffect(() => {
    if (scrambleOnMount) {
      scramble();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, scrambleOnMount]);

  return (
    <span
      className={cn("relative inline-block cursor-default select-none", className)}
      onMouseEnter={() => {
        setIsHovered(true);
        scramble();
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Base Text */}
      <span className="relative z-10">{displayText}</span>

      {/* Glitch Layers for Chromatic Aberration */}
      {isHovered && (
        <>
          <motion.span
            className="absolute top-0 left-[-2px] z-0 text-rose-500 opacity-70 mix-blend-screen pointer-events-none select-none"
            initial={{ x: 0, opacity: 0 }}
            animate={{ x: [-2, 2, -1, 3, 0], opacity: [0, 0.8, 0.4, 0.9, 0] }}
            transition={{ duration: 0.2, repeat: Infinity, repeatType: "mirror" }}
            aria-hidden="true"
          >
            {displayText}
          </motion.span>
          <motion.span
            className="absolute top-0 left-[2px] z-0 text-cyan-500 opacity-70 mix-blend-screen pointer-events-none select-none"
            initial={{ x: 0, opacity: 0 }}
            animate={{ x: [2, -2, 1, -3, 0], opacity: [0, 0.8, 0.4, 0.9, 0] }}
            transition={{ duration: 0.2, repeat: Infinity, repeatType: "mirror", delay: 0.05 }}
            aria-hidden="true"
          >
            {displayText}
          </motion.span>
        </>
      )}
    </span>
  );
}

export default CyberGlitchText;
