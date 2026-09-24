"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  ChatCircle,
  Brain,
  Database,
  TerminalWindow,
  Code,
  FileText,
  SlackLogo,
  NotionLogo,
  Check,
  CircleNotch,
  Clock,
  Minus,
  Globe,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────
   Niche: AI Agent Workspace
   Grid: 3 cards top row · 2 cards bottom row
   Machined Obsidian / OLED True Black Theme
────────────────────────────────────────────────────── */

export interface FeatCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
  /** Optional extra classes for sizing/spanning */
  className?: string;
}

export function FeatCard({ title, description, children, className = "" }: FeatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative flex flex-col gap-2 overflow-hidden rounded-[20px] p-4.5 transition-all duration-300",
        "bg-[#0e0e11] border border-white/[0.08] hover:border-white/[0.16]",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06),0_4px_20px_rgba(0,0,0,0.6)]",
        className
      )}
    >
      <div className="z-10 flex flex-col gap-1">
        <h3 className="font-bold text-white text-sm tracking-tight font-sans">{title}</h3>
        <p className="text-neutral-400 text-xs leading-relaxed max-w-[92%] font-sans">{description}</p>
      </div>
      <div className="relative mt-2.5 flex-1 w-full rounded-[14px] overflow-hidden border border-white/[0.06] bg-[#050507]">
        {children}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Card1 – Agent Pipeline
   Precision hardware IC node graph with active laser traces
   ───────────────────────────────────────────── */

type ActiveStep = 'request' | 'router' | 'agent' | 'memory' | 'tools' | 'response';

const VW = 320;
const VH = 240;

interface NodeConfig {
  id: string;
  x: number;
  y: number;
  icon?: React.ComponentType<{ className?: string; weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone" }>;
  label?: string;
  type: 'box' | 'circle';
}

const NODES: NodeConfig[] = [
  { id: 'A', x: 50, y: 120, icon: ChatCircle, label: "REQUEST", type: 'box' },
  { id: 'Router', x: 125, y: 120, type: 'circle' },
  { id: 'C', x: 200, y: 120, icon: Brain, label: "AGENT", type: 'box' },
  { id: 'B', x: 280, y: 50, icon: Database, label: "MEMORY", type: 'box' },
  { id: 'D', x: 280, y: 190, icon: TerminalWindow, label: "TOOLS", type: 'box' },
];

interface FlowPath {
  id: string;
  d: string;
  activeSteps: ActiveStep[];
  flowDirection: 'forward' | 'backward' | 'both';
  colorClass: string;
}

const PATHS: FlowPath[] = [
  {
    id: "a-to-router",
    d: "M 78 120 L 113 120",
    activeSteps: ["request"],
    flowDirection: "forward",
    colorClass: "text-cyan-400",
  },
  {
    id: "router-to-agent",
    d: "M 137 120 L 172 120",
    activeSteps: ["agent"],
    flowDirection: "forward",
    colorClass: "text-violet-400",
  },
  {
    id: "agent-to-memory",
    d: "M 200 92 L 200 50 L 252 50",
    activeSteps: ["memory"],
    flowDirection: "both",
    colorClass: "text-fuchsia-400",
  },
  {
    id: "agent-to-tools",
    d: "M 200 148 L 200 190 L 252 190",
    activeSteps: ["tools"],
    flowDirection: "both",
    colorClass: "text-emerald-400",
  },
  {
    id: "response-flow-1",
    d: "M 172 120 L 137 120",
    activeSteps: ["response"],
    flowDirection: "forward",
    colorClass: "text-cyan-400",
  },
  {
    id: "response-flow-2",
    d: "M 113 120 L 78 120",
    activeSteps: ["response"],
    flowDirection: "forward",
    colorClass: "text-cyan-400",
  },
];

const NODE_COLORS: Record<string, {
  bg: string;
  border: string;
  iconColor: string;
  activeBorder: string;
  activeBg: string;
  activeGlow: string;
}> = {
  A: {
    bg: "bg-[#121216]",
    border: "border-neutral-800",
    iconColor: "text-cyan-400",
    activeBorder: "border-cyan-400/80",
    activeBg: "bg-cyan-950/40",
    activeGlow: "shadow-[0_0_16px_rgba(34,211,238,0.25)]",
  },
  Router: {
    bg: "bg-[#121216]",
    border: "border-neutral-800",
    iconColor: "text-amber-400",
    activeBorder: "border-amber-400/80",
    activeBg: "bg-amber-950/40",
    activeGlow: "shadow-[0_0_16px_rgba(251,191,36,0.25)]",
  },
  C: {
    bg: "bg-[#121216]",
    border: "border-neutral-800",
    iconColor: "text-violet-400",
    activeBorder: "border-violet-400/80",
    activeBg: "bg-violet-950/40",
    activeGlow: "shadow-[0_0_16px_rgba(167,139,250,0.25)]",
  },
  B: {
    bg: "bg-[#121216]",
    border: "border-neutral-800",
    iconColor: "text-fuchsia-400",
    activeBorder: "border-fuchsia-400/80",
    activeBg: "bg-fuchsia-950/40",
    activeGlow: "shadow-[0_0_16px_rgba(232,121,249,0.25)]",
  },
  D: {
    bg: "bg-[#121216]",
    border: "border-neutral-800",
    iconColor: "text-emerald-400",
    activeBorder: "border-emerald-400/80",
    activeBg: "bg-emerald-950/40",
    activeGlow: "shadow-[0_0_16px_rgba(52,211,153,0.25)]",
  },
};

export function Card1() {
  const [step, setStep] = useState<ActiveStep>("request");

  useEffect(() => {
    const steps: ActiveStep[] = ["request", "router", "agent", "memory", "tools", "response"];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % steps.length;
      setStep(steps[idx]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const isNodeActive = (nodeId: string) => {
    switch (step) {
      case 'request':
        return nodeId === 'A';
      case 'router':
        return nodeId === 'Router';
      case 'agent':
        return nodeId === 'C';
      case 'memory':
        return nodeId === 'C' || nodeId === 'B';
      case 'tools':
        return nodeId === 'C' || nodeId === 'D';
      case 'response':
        return nodeId === 'C' || nodeId === 'Router' || nodeId === 'A';
      default:
        return false;
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden select-none bg-[#050507] rounded-xl flex items-center justify-center p-2">
      {/* ── Layer 1: Clean dotted grid ── */}
      <svg className="absolute inset-0 w-full h-full" aria-hidden>
        <defs>
          <pattern id="clean-grid" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.75" fill="currentColor" className="text-neutral-800/80" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#clean-grid)" />
      </svg>

      {/* ── Layer 2: Connector SVG & Nodes ── */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        {/* Base Static Connection Paths */}
        <path d="M 78 120 L 113 120" fill="none" stroke="currentColor" className="text-neutral-800" strokeWidth="1" />
        <path d="M 137 120 L 172 120" fill="none" stroke="currentColor" className="text-neutral-800" strokeWidth="1" />
        <path d="M 200 92 L 200 50 L 252 50" fill="none" stroke="currentColor" className="text-neutral-800" strokeWidth="1" />
        <path d="M 200 148 L 200 190 L 252 190" fill="none" stroke="currentColor" className="text-neutral-800" strokeWidth="1" />

        {/* Animated Flow Overlays */}
        {PATHS.map((p) => {
          const isActive = p.activeSteps.includes(step);
          if (!isActive) return null;

          return (
            <g key={p.id}>
              {/* Outer soft glow stroke */}
              <motion.path
                d={p.d}
                fill="none"
                stroke="currentColor"
                className={p.colorClass}
                strokeWidth="3.5"
                strokeOpacity="0.25"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
              {/* Sharp solid flowing stroke */}
              <motion.path
                d={p.d}
                fill="none"
                stroke="currentColor"
                className={p.colorClass}
                strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
              />
            </g>
          );
        })}

        {/* ForeignObjects for Nodes */}
        {NODES.map((node) => {
          const isBox = node.type === 'box';
          const w = isBox ? 56 : 24;
          const h = isBox ? 56 : 24;
          const isActive = isNodeActive(node.id);
          const colorStyles = NODE_COLORS[node.id];

          return (
            <foreignObject
              key={node.id}
              x={node.x - w / 2}
              y={node.y - h / 2}
              width={w}
              height={h}
              className="overflow-visible"
            >
              <div className="w-full h-full flex items-center justify-center">
                {isBox && node.icon ? (
                  <div
                    className={`w-full h-full rounded-[14px] border flex flex-col items-center justify-center transition-all duration-300 ${
                      isActive
                        ? `${colorStyles.activeBg} ${colorStyles.activeBorder} ${colorStyles.activeGlow} scale-[1.04]`
                        : `${colorStyles.bg} ${colorStyles.border} shadow-sm`
                    }`}
                  >
                    {/* Centered Icon */}
                    <div className="mb-0.5 flex items-center justify-center">
                      <node.icon
                        className={`w-5 h-5 transition-colors ${isActive ? colorStyles.iconColor : 'text-neutral-400'}`}
                        weight={isActive ? "fill" : "regular"}
                      />
                    </div>
                    <span className={`text-[8.5px] font-mono font-bold tracking-wider select-none ${isActive ? 'text-white' : 'text-neutral-400'}`}>
                      {node.label}
                    </span>
                  </div>
                ) : (
                  /* Central Router Node */
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-xs transition-all duration-300 ${
                      isActive
                        ? "bg-amber-950/60 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.35)] scale-110"
                        : "bg-[#121216] border-neutral-700"
                    }`}
                  >
                    <motion.div
                      className={`w-2.5 h-2.5 rounded-full border border-dashed ${
                        isActive ? "border-amber-400" : "border-neutral-500"
                      }`}
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    />
                  </div>
                )}
              </div>
            </foreignObject>
          );
        })}
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Card2 – Live Token / Cost Monitor
   ───────────────────────────────────────────── */
export function Card2() {
  const bars = [45, 75, 35, 85, 60, 95, 50];
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  const [activeIdx, setActiveIdx] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev === 0 ? 1 : 0));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col gap-3.5 justify-between p-2">
      {/* Stats row with a 0.5rem slide offset margin */}
      <div className="flex gap-4 pt-[0.625rem] pr-[0.625rem] pb-0.5 pl-0.5">
        {[
          { label: "Tokens/min", value: "12.4k", trend: "+8%" },
          { label: "Cost/run", value: "$0.042", trend: "-3%" },
        ].map((s, i) => {
          const isActive = i === activeIdx || hoveredIdx === i;

          return (
            <div key={i} className="flex-1 h-[76px] relative select-none">
              {/* Background Hatched Scale Card */}
              <div
                className="absolute inset-0 rounded-xl border border-neutral-800 bg-[#08080a] text-neutral-800"
                style={{
                  backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)",
                }}
              />

              {/* Foreground Card */}
              <motion.div
                className="absolute inset-0 w-full h-full rounded-xl bg-[#121215] border border-white/[0.08] shadow-md p-3 hover:bg-[#18181c] transition-colors duration-300 backdrop-blur-[2px] flex items-center justify-between gap-3 cursor-pointer"
                animate={{
                  x: isActive ? "0.5rem" : "0rem",
                  y: isActive ? "-0.5rem" : "0rem",
                }}
                transition={{ type: "spring", stiffness: 200, damping: 16 }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Metric Details */}
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] text-neutral-400 font-mono uppercase tracking-widest leading-none">{s.label}</span>
                  <span className="text-base font-bold font-mono text-white leading-none mt-1.5 tracking-tight">{s.value}</span>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={`text-[8px] font-mono font-bold ${
                      s.trend.startsWith("+") ? "text-emerald-400" : "text-rose-400"
                    }`}>
                      {s.trend}
                    </span>
                    <span className="text-[8px] text-neutral-500 font-mono">prev</span>
                  </div>
                </div>

                {/* High-Precision Sparkline */}
                <div className="w-12 h-6 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 48 24">
                    <motion.path
                      d={i === 0
                        ? "M 0 18 L 16 11 L 32 14 L 48 4"
                        : "M 0 4 L 16 12 L 32 8 L 48 18"
                      }
                      fill="none"
                      stroke="currentColor"
                      className="text-neutral-600"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.15, ease: "easeOut" }}
                    />

                    {/* Vertex Dots */}
                    {(i === 0
                      ? [{ x: 0, y: 18 }, { x: 16, y: 11 }, { x: 32, y: 14 }, { x: 48, y: 4 }]
                      : [{ x: 0, y: 4 }, { x: 16, y: 12 }, { x: 32, y: 8 }, { x: 48, y: 18 }]
                    ).map((pt, idx) => (
                      <motion.circle
                        key={idx}
                        cx={pt.x}
                        cy={pt.y}
                        r="1.5"
                        className="fill-[#121215] stroke-rose-500"
                        strokeWidth="1.2"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5 + idx * 0.08, duration: 0.25 }}
                      />
                    ))}
                  </svg>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Bar chart */}
      <div className="flex-1 flex items-end gap-2.5 px-0.5 min-h-[90px]">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 h-full rounded-xl bg-[#08080a] border border-neutral-800/80 relative overflow-hidden text-neutral-800"
            style={{
              backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 6px, currentColor 6px, currentColor 7px)",
            }}
          >
            {/* Animated Solid Filled Bar */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-rose-700 to-rose-500 border-t border-x border-rose-400/80 shadow-[0_0_12px_rgba(244,63,94,0.3)] rounded-t-[10px]"
              initial={{ height: "0%" }}
              animate={{
                height: [
                  `${h}%`,
                  `${Math.min(95, h + 15)}%`,
                  `${Math.max(10, h - 20)}%`,
                  `${Math.min(90, h + 8)}%`,
                  `${h}%`
                ],
              }}
              transition={{
                repeat: Infinity,
                duration: 3 + (i % 3) * 0.8,
                ease: "easeInOut",
                delay: i * 0.1,
              }}
            />
          </div>
        ))}
      </div>

      {/* X labels */}
      <div className="flex gap-2.5 px-0.5">
        {days.map((d, i) => (
          <p key={i} className="flex-1 text-center text-[8px] text-neutral-500 font-mono font-medium">{d}</p>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Card3 – Stacked Infinite-Scroll Activity Feed
   ──────────────────────────────────────────── */

const STATUS_ICONS: Record<string, {
  icon: React.ComponentType<{ weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone"; className?: string }>;
  color: string;
  bg: string;
  border: string;
}> = {
  done: { icon: Check, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  running: { icon: CircleNotch, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30" },
  waiting: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  idle: { icon: Minus, color: "text-neutral-400", bg: "bg-neutral-800/50", border: "border-neutral-700/50" },
};

export function Card3() {
  const logs = [
    { agent: "Planner", action: "Decomposed task into 4 sub-goals", status: "done", t: "0.2s" },
    { agent: "Researcher", action: "Queried web for latest embeddings", status: "done", t: "1.4s" },
    { agent: "Coder", action: "Generating vector DB schema…", status: "running", t: "3.1s" },
    { agent: "Reviewer", action: "Awaiting output from Coder", status: "waiting", t: "—" },
    { agent: "Writer", action: "Idle — queued", status: "idle", t: "—" },
  ];

  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % logs.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [logs.length]);

  const getSlot = (i: number) => {
    const N = logs.length;
    let rel = i - activeIdx;
    if (rel > Math.floor(N / 2)) rel -= N;
    if (rel < -Math.floor(N / 2)) rel += N;
    return rel;
  };

  const Y: Record<string, number> = { "-2": -68, "-1": -38, "0": 0, "1": 38, "2": 68 };

  return (
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
      {logs.map((l, i) => {
        const slot = getSlot(i);
        const si = STATUS_ICONS[l.status] || STATUS_ICONS.idle;
        const abs = Math.abs(slot);
        const isActive = slot === 0;
        const isVisible = abs <= 2;

        const yOffset = Y[String(slot)] ?? (slot < 0 ? -120 : 120);
        const scale = isActive ? 1 : abs === 1 ? 0.93 : 0.87;
        const opacity = isActive ? 1 : abs === 1 ? 0.65 : 0.38;
        const zIndex = isActive ? 30 : abs === 1 ? 20 : 10;

        return (
          <motion.div
            key={l.agent}
            className="absolute left-0 right-0 mx-auto px-1.5"
            style={{ zIndex }}
            animate={{
              y: isVisible ? yOffset : slot < 0 ? -150 : 150,
              scale,
              opacity: isVisible ? opacity : 0,
            }}
            transition={{
              y: { type: "spring", stiffness: 500, damping: 35 },
              scale: { type: "spring", stiffness: 500, damping: 35 },
              opacity: { duration: 0.25, ease: "easeOut" },
            }}
          >
            <div className={`w-full rounded-2xl border flex items-center gap-2.5 transition-all duration-300 ${
              isActive
                ? "px-3 py-2.5 bg-[#141418] border-white/[0.14] shadow-xl text-white"
                : "px-2.5 py-1.5 bg-[#0a0a0d] border-white/[0.04] text-neutral-400"
            }`}>

              {/* Icon badge */}
              <div className={`shrink-0 rounded-[8px] flex items-center justify-center font-bold transition-all duration-300 ${si.bg} border ${si.border} ${si.color} shadow-xs ${
                isActive ? "w-8 h-8" : "w-5 h-5"
              }`}>
                <si.icon weight="bold" className={`${isActive ? "w-4 h-4" : "w-2.5 h-2.5"} ${l.status === "running" ? "animate-spin" : ""}`} />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`font-mono font-bold leading-none ${isActive ? "text-[10px] text-white" : "text-[9px] text-neutral-400"}`}>
                    {l.agent}
                  </span>
                  <span className={`font-mono uppercase tracking-wide rounded px-1 py-0.5 ${si.bg} ${si.color} ${isActive ? "text-[7px]" : "text-[6px]"}`}>
                    {l.status}
                  </span>
                </div>
                {isActive && (
                  <p className="text-[9px] text-neutral-300 truncate mt-0.5 leading-tight font-sans">{l.action}</p>
                )}
              </div>

              {isActive && (
                <span className="text-[9px] font-mono text-neutral-500 shrink-0">{l.t}</span>
              )}
            </div>
          </motion.div>
        );
      })}

      {/* Progress dots */}
      <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1">
        {logs.map((_, i) => (
          <motion.div
            key={i}
            className={`rounded-full ${i === activeIdx ? "bg-rose-500" : "bg-neutral-700"}`}
            animate={{
              width: i === activeIdx ? 14 : 4,
              opacity: i === activeIdx ? 1 : 0.4,
            }}
            style={{ height: 3 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Card4 – Memory / Knowledge Base Namespaces
   ───────────────────────────────────────────── */

const NS_ICONS: Record<string, React.ComponentType<{ size?: number; weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone"; className?: string }>> = {
  codebase: Code,
  docs: FileText,
  slack: SlackLogo,
  notion: NotionLogo,
};

const NS_COLORS: Record<string, { bar: string; dot: string; badge: string }> = {
  codebase: { bar: "from-violet-600 to-violet-400", dot: "bg-violet-400", badge: "bg-violet-500/10 text-violet-300 border border-violet-500/25" },
  docs: { bar: "from-sky-600 to-sky-400", dot: "bg-sky-400", badge: "bg-sky-500/10 text-sky-300 border border-sky-500/25" },
  slack: { bar: "from-emerald-600 to-emerald-400", dot: "bg-emerald-400", badge: "bg-emerald-500/10 text-emerald-300 border border-emerald-500/25" },
  notion: { bar: "from-amber-600 to-amber-400", dot: "bg-amber-400", badge: "bg-amber-500/10 text-amber-300 border border-amber-500/25" },
};

const RETRIEVAL_QUERIES = [
  { ns: "codebase", q: "vector embeddings auth module", t: "0.2s" },
  { ns: "docs", q: "API rate limiting config", t: "1.1s" },
  { ns: "codebase", q: "Redis cache invalidation patterns", t: "2.4s" },
  { ns: "slack", q: "deployment discussion #eng", t: "4.0s" },
  { ns: "notion", q: "Q3 roadmap — agent features", t: "5.8s" },
  { ns: "docs", q: "OpenAI function calling schema", t: "7.2s" },
];

export function Card4() {
  const namespaces = [
    { name: "codebase", hits: 342, fill: 88 },
    { name: "docs", hits: 218, fill: 56 },
    { name: "slack", hits: 97, fill: 25 },
    { name: "notion", hits: 54, fill: 14 },
  ];

  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => (prev + 1) % RETRIEVAL_QUERIES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const activeNs = RETRIEVAL_QUERIES[tick].ns;
  const recentQueries = [0, 1, 2, 3].map(
    (offset) => RETRIEVAL_QUERIES[(tick - offset + RETRIEVAL_QUERIES.length) % RETRIEVAL_QUERIES.length]
  );

  return (
    <div className="w-full h-full flex gap-5 py-2 px-3">

      {/* ── Left panel: Namespace bars ── */}
      <div className="flex-1 flex flex-col gap-0 min-w-0 pr-2">
        <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-400 mb-3">Namespaces</p>

        <div className="flex flex-col gap-3 flex-1">
          {namespaces.map((ns, i) => {
            const c = NS_COLORS[ns.name] || NS_COLORS.codebase;
            const isActive = ns.name === activeNs;
            const Icon = (NS_ICONS[ns.name] || Database) as React.ComponentType<{ size?: number; weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone"; className?: string }>;

            return (
              <div key={ns.name} className="flex items-center gap-3 group relative">

                {/* Icon Container */}
                <div
                  className={`relative flex shrink-0 items-center justify-center w-[36px] h-[36px] rounded-[12px] border transition-all duration-300 ${
                    isActive
                      ? `bg-neutral-900 border-white/20 text-white shadow-md scale-105`
                      : 'bg-[#101014] border-neutral-800 text-neutral-400 shadow-xs'
                  }`}
                >
                  <Icon size={16} weight={isActive ? "fill" : "regular"} className="relative z-10" />
                </div>

                {/* Name */}
                <span className={`text-[10px] font-mono w-16 shrink-0 transition-colors duration-300 ${
                  isActive ? "text-white font-bold" : "text-neutral-400 group-hover:text-neutral-200"
                }`}>
                  {ns.name}
                </span>

                {/* Bar track */}
                <div className="flex-1 h-1.5 bg-neutral-900 border border-white/[0.04] rounded-full overflow-hidden relative shadow-inner">
                  <motion.div
                    className={`absolute left-0 top-0 bottom-0 rounded-full overflow-hidden bg-gradient-to-r ${c.bar}`}
                    initial={{ width: "0%" }}
                    animate={{ width: `${ns.fill}%`, opacity: isActive ? 1 : 0.4 }}
                    transition={{
                      width: { duration: 1.2, delay: i * 0.1, type: "spring", bounce: 0.2 },
                      opacity: { duration: 0.4 },
                    }}
                  >
                    {/* Scanning light beam */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-transparent via-white/70 to-transparent"
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      />
                    )}
                  </motion.div>
                </div>

                {/* Hit count */}
                <div className={`flex items-center gap-1.5 w-10 justify-end transition-all duration-300 ${
                  isActive ? "opacity-100 scale-105" : "opacity-60 scale-100"
                }`}>
                  <span className={`text-[9px] font-mono font-medium ${isActive ? "text-white font-bold" : "text-neutral-400"}`}>
                    {ns.hits}
                  </span>
                  {isActive && (
                    <motion.div
                      className={`w-1 h-1 rounded-full ${c.dot}`}
                      animate={{ opacity: [1, 0.2, 1], scale: [1, 1.5, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 pt-3 mt-auto">
          <div className="relative flex items-center justify-center w-2 h-2">
            <motion.div
              className="absolute inset-0 rounded-full bg-emerald-400/40"
              animate={{ scale: [1, 2.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <span className="text-[8px] font-mono text-neutral-400 font-medium tracking-wide">Live retrieval active</span>
        </div>
      </div>

      {/* Thin divider */}
      <div className="w-px bg-neutral-800 self-stretch shrink-0" />

      {/* ── Right panel: Retrieval log ── */}
      <div className="w-[172px] shrink-0 flex flex-col gap-0">
        <p className="text-[8px] font-mono uppercase tracking-widest text-neutral-400 mb-2.5">Retrieval Log</p>

        <div className="flex flex-col gap-1.5 flex-1 overflow-hidden">
          {recentQueries.map((q, qi) => {
            const c = NS_COLORS[q.ns] || NS_COLORS.codebase;
            return (
              <motion.div
                key={`${q.ns}-${q.q}-${qi}`}
                className="rounded-xl border border-white/[0.07] bg-[#111114] px-2.5 py-2 shadow-xs"
                initial={{ opacity: 0, y: -8 }}
                animate={{
                  opacity: qi === 0 ? 1 : qi === 1 ? 0.8 : qi === 2 ? 0.5 : 0.25,
                  y: 0,
                }}
                transition={{ type: "spring", stiffness: 500, damping: 35, delay: qi * 0.05 }}
              >
                <div className="flex items-center gap-1 mb-1">
                  <span className={`text-[6.5px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded-md ${c.badge}`}>
                    {q.ns}
                  </span>
                  <span className="text-[7px] font-mono text-neutral-500 ml-auto tabular-nums">{q.t}</span>
                </div>
                <p className="text-[8px] text-neutral-200 leading-tight font-mono truncate">{q.q}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

/* ─────────────────────────────────────────────
   Card5 – Tool Call Inspector
   ───────────────────────────────────────────── */
export function Card5() {
  const tools = [
    { name: "web_search", calls: 14, icon: Globe, latency: "280ms", bg: "bg-sky-500/10", border: "border-sky-500/30", textColor: "text-sky-400", bar: "bg-gradient-to-r from-sky-500 to-sky-400" },
    { name: "code_exec", calls: 8, icon: TerminalWindow, latency: "1.2s", bg: "bg-emerald-500/10", border: "border-emerald-500/30", textColor: "text-emerald-400", bar: "bg-gradient-to-r from-emerald-500 to-emerald-400" },
    { name: "file_read", calls: 22, icon: FileText, latency: "12ms", bg: "bg-amber-500/10", border: "border-amber-500/30", textColor: "text-amber-400", bar: "bg-gradient-to-r from-amber-500 to-amber-400" },
    { name: "vector_query", calls: 31, icon: Brain, latency: "95ms", bg: "bg-violet-500/10", border: "border-violet-500/30", textColor: "text-violet-400", bar: "bg-gradient-to-r from-violet-500 to-violet-400" },
  ];

  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      <div className="grid grid-cols-2 gap-2 w-full">
        {tools.map((t, i) => (
          <motion.div
            key={i}
            className="relative rounded-[16px] border border-white/[0.07] bg-[#111114] shadow-xs hover:border-white/[0.16] transition-all duration-300 flex flex-col justify-between p-2.5 group"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Top Row: Icon + Calls */}
            <div className="flex items-start justify-between">
              <div className={`w-[28px] h-[28px] rounded-[8px] flex items-center justify-center ${t.bg} border ${t.border} ${t.textColor} shadow-xs group-hover:scale-105 transition-transform duration-300`}>
                <t.icon weight="fill" className="w-3.5 h-3.5 relative z-10" />
              </div>

              <div className="flex flex-col items-end gap-0.5 mt-0.5">
                <span className="text-[12px] font-mono font-bold text-white leading-none">{t.calls}</span>
                <span className="text-[7px] font-mono text-neutral-500 uppercase tracking-widest leading-none">Calls</span>
              </div>
            </div>

            {/* Bottom Row: Name + Latency + Progress */}
            <div className="mt-2 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-medium text-neutral-200 tracking-tight">{t.name}</span>
                <span className="text-[8px] font-mono text-neutral-400 tabular-nums">{t.latency}</span>
              </div>
              <div className="w-full h-1.5 bg-neutral-900 border border-white/[0.04] rounded-full overflow-hidden shadow-inner relative">
                <motion.div
                  className={`absolute left-0 top-0 bottom-0 rounded-full ${t.bar}`}
                  initial={{ width: "0%" }}
                  animate={{ width: `${(t.calls / 31) * 100}%` }}
                  transition={{ delay: 0.4 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Grid Component
   ───────────────────────────────────────────── */
const CARDS = [
  {
    title: "Agent Pipeline",
    description: "Visualise how tasks flow across your multi-agent graph in real time.",
    visual: <Card1 />,
    colSpan: "lg:col-span-1",
    height: "h-[280px]",
  },
  {
    title: "Token Monitor",
    description: "Track LLM token usage and cost-per-run across every model call.",
    visual: <Card2 />,
    colSpan: "lg:col-span-1",
    height: "h-[280px]",
  },
  {
    title: "Activity Feed",
    description: "Real-time logs of agent actions, tool calls, and memory retrievals.",
    visual: <Card3 />,
    colSpan: "lg:col-span-1",
    height: "h-[280px]",
  },
  {
    title: "Knowledge Base",
    description: "Semantic search across documents, codebases, and conversations.",
    visual: <Card4 />,
    colSpan: "lg:col-span-2",
    height: "h-[280px]",
  },
  {
    title: "Tool Inspector",
    description: "Monitor tool usage, latency, and success rates across all agents.",
    visual: <Card5 />,
    colSpan: "lg:col-span-1",
    height: "h-[280px]",
  }
];

export interface AgentBentoGridProps {
  className?: string;
}

export function AgentBentoGrid({ className }: AgentBentoGridProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-6xl mx-auto", className)}>
      {CARDS.map((card, idx) => (
        <FeatCard
          key={idx}
          title={card.title}
          description={card.description}
          className={cn(card.colSpan, card.height)}
        >
          {card.visual}
        </FeatCard>
      ))}
    </div>
  );
}

export default AgentBentoGrid;
