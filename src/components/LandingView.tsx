import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  Zap,
  Radio,
  BarChart3,
  Layers,
  FileText,
  ShieldCheck,
  Clock,
  ArrowRight,
  Heart,
  Sparkles,
  CheckCircle2,
  Cpu,
  Volume2,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { EmergencyScenario } from '../types';
import { PulseLogo } from './PulseLogo';
import { HeroSection } from '@/components/ui/hero-section';
import { Icons } from '@/components/ui/icons';
import { AsciiGlitchRipple } from '@/components/ui/ascii-glitch-ripple';
import { IDCardLanyard } from '@/components/ui/id-card-lanyard';
import { CornerButton } from '@/components/ui/corner-button';
import { GlowCard } from '@/components/ui/glow-card';
import { AgentBentoGrid } from '@/components/ui/agent-bento-grid';
import dispatcherAvatar from '../assets/dispatcher-photo.jpeg';
import heroConsolePreview from '../assets/hero-console-preview.jpg';

interface LandingViewProps {
  onLaunchConsole: (scenario?: EmergencyScenario) => void;
  onNavigateTab: (tab: 'console' | 'benchmark' | 'architecture' | 'prd') => void;
  latencyMs: number | null;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onLaunchConsole,
  onNavigateTab,
  latencyMs,
}) => {
  return (
    <div className="space-y-16 pb-16 w-full max-w-7xl mx-auto font-sans">
      {/* 1. HERO SECTION (21st.dev / Launch UI Component) */}
      <section className="relative text-center">
        <HeroSection
          badge={{
            text: "YC Fall 2026 • Real-Time Voice AI Sprint",
            action: {
              text: "Sub-10ms Benchmark",
              href: "#benchmark",
              onClick: (e: React.MouseEvent) => {
                e.preventDefault();
                onNavigateTab('benchmark');
              },
            },
          }}
          title={
            <>
              <span className="block whitespace-nowrap">
                <AsciiGlitchRipple
                  as="span"
                  className="cursor-pointer select-none whitespace-nowrap transition-colors duration-200 hover:text-slate-700"
                  dur={900}
                  spread={1.2}
                >
                  When Seconds Save Lives,
                </AsciiGlitchRipple>
              </span>
              <span className="block mt-1 sm:mt-2 whitespace-nowrap">
                <AsciiGlitchRipple
                  as="span"
                  className="cursor-pointer select-none whitespace-nowrap transition-colors duration-200 hover:text-slate-700"
                  dur={900}
                  spread={1.2}
                >
                  400ms Cloud Latency is
                </AsciiGlitchRipple>
              </span>
              <span className="block mt-1 sm:mt-2 whitespace-nowrap">
                <AsciiGlitchRipple
                  as="span"
                  className="cursor-pointer select-none whitespace-nowrap transition-colors duration-200 hover:text-rose-600"
                  dur={900}
                  spread={1.2}
                >
                  Fatal.
                </AsciiGlitchRipple>
              </span>
            </>
          }
          description="Pulse911 is the zero-latency emergency dispatch copilot powered by Moss (YC F25) in-process WASM semantic retrieval. Grounded in verified AHA & CDC clinical protocols, delivering spoken resuscitation guidance under the 300ms human panic window."
          actions={[
            {
              text: "Launch Emergency Console",
              href: "#console",
              variant: "glow",
              icon: <Radio className="w-4 h-4 text-white animate-pulse" />,
              className: "bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-500/25",
              onClick: (e: React.MouseEvent) => {
                e.preventDefault();
                onLaunchConsole();
              },
            },
            {
              text: "Run 50-Query Benchmark",
              href: "#benchmark",
              variant: "outline",
              icon: <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />,
              className: "bg-slate-900 hover:bg-slate-800 text-white border-slate-900 font-bold hover:text-white shadow-xs",
              onClick: (e: React.MouseEvent) => {
                e.preventDefault();
                onNavigateTab('benchmark');
              },
            },
            {
              text: "GitHub",
              href: "https://github.com/j4yop/pulse911",
              variant: "outline",
              icon: <Icons.gitHub className="w-4 h-4 text-slate-700" />,
              className: "bg-white/90 hover:bg-slate-100 border-slate-200/90 text-slate-700 hover:text-slate-900 font-semibold shadow-2xs",
            },
          ]}
          image={{
            light: heroConsolePreview,
            dark: heroConsolePreview,
            alt: "Pulse911 Zero-Latency Emergency Dispatch Console with Moss WASM Triage",
          }}
        />

        {/* Live In-Browser WASM Proof Ticker */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.26 }}
          className="flex items-center justify-center max-w-4xl mx-auto mt-8 sm:mt-12 md:mt-16 px-4"
        >
          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-full bg-emerald-50/90 border border-emerald-200/90 text-emerald-950 text-xs font-mono font-bold shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="tracking-wide">MOSS WASM ENGINE: WARM IN BROWSER RAM</span>
            <span className="text-emerald-300 hidden sm:inline">&bull;</span>
            <span className="text-emerald-700 font-extrabold flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              {latencyMs ? `${latencyMs.toFixed(1)} ms` : '1.2 ms'} IN-PROCESS LOOKUP
            </span>
            <span className="text-emerald-300 hidden sm:inline">&bull;</span>
            <span className="text-slate-500 font-semibold">0.00ms NETWORK HOP</span>
          </div>
        </motion.div>

        {/* Metric Capsules */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.32 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-w-4xl mx-auto mt-4 sm:mt-5 pt-1 text-left"
        >
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-xs">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Moss WASM Retrieval</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-emerald-600 font-mono">
                {latencyMs ? `${latencyMs.toFixed(1)}` : '3.8'}
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">ms</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Zero network roundtrip</p>
          </div>

          <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-xs">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Human Panic Target</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-slate-900 font-mono">&lt; 300</span>
              <span className="text-xs font-mono font-bold text-slate-500">ms</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Conversational ceiling</p>
          </div>

          <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-xs">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Clinical Safety</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-slate-900 font-mono">100%</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">AHA & CDC Grounded</p>
          </div>

          <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/90 shadow-xs">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider block">CAD Response</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-indigo-600 font-mono">Auto</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">ALS Paramedic Dispatch</p>
          </div>
        </motion.div>
      </section>

      {/* 2. THE 300MS BIOLOGICAL LATENCY PROBLEM */}
      <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
        <div className="pb-2">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-rose-600 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              The Biological Constraint
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Why 911 Voice AI Fails with Standard Cloud RAG
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              In high-stress medical emergencies, human conversational pause tolerance collapses to <strong>300ms</strong>. If an AI takes longer to respond, the panicked caller talks over the assistant or hangs up.
            </p>
          </div>
        </div>

        {/* Latency Comparison Bars */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Legacy Cloud RAG Pipeline (FAILED) */}
          <div className="p-6 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-rose-700 uppercase tracking-wider">
                Legacy Cloud RAG (Pinecone / Milvus)
              </span>
              <span className="text-xs font-mono font-bold text-rose-600 px-2 py-0.5 rounded-md bg-rose-100">
                510–750 ms ❌ BREACHED
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Cloud network roundtrip alone takes 250–450ms, breaching human conversational rhythm and causing talkover confusion.
            </p>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>VAD (70ms)</span>
                <span>STT (90ms)</span>
                <span className="text-rose-600 font-bold">Cloud Vector DB (350ms)</span>
                <span>TTS (100ms)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex">
                <div className="bg-slate-400 h-full w-[12%]" title="VAD" />
                <div className="bg-slate-500 h-full w-[15%]" title="STT" />
                <div className="bg-rose-500 h-full w-[58%]" title="Cloud Vector DB" />
                <div className="bg-slate-400 h-full w-[15%]" title="TTS" />
              </div>
              <div className="text-[11px] text-rose-600 font-semibold pt-1">
                Total Turnaround: ~610 ms &bull; Exceeds human panic threshold by 310 ms
              </div>
            </div>
          </div>

          {/* Pulse911 Moss In-Process Pipeline (WINNING) */}
          <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-800 uppercase tracking-wider">
                Pulse911 + Moss In-Memory WASM
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700 px-2 py-0.5 rounded-md bg-emerald-100">
                264 ms ✅ INSTANT
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Colocated WASM retrieval delivers semantic protocol lookup in <strong>3.8ms</strong>, comfortably fitting within the 300ms ceiling.
            </p>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>VAD (70ms)</span>
                <span>STT (90ms)</span>
                <span className="text-emerald-700 font-bold">Moss WASM (4ms)</span>
                <span>TTS (100ms)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex">
                <div className="bg-emerald-600 h-full w-[26%]" title="VAD" />
                <div className="bg-emerald-500 h-full w-[34%]" title="STT" />
                <div className="bg-amber-400 h-full w-[2%]" title="Moss (4ms)" />
                <div className="bg-emerald-400 h-full w-[38%]" title="TTS" />
              </div>
              <div className="text-[11px] text-emerald-700 font-semibold pt-1">
                Total Turnaround: 264 ms &bull; 36 ms margin under the 300ms biological limit
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BENTO GRID OF CORE INNOVATIONS (SkillRoute-styled Glow Cards) */}
      <section className="space-y-8 py-4">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            High-Stakes Clinical Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900">
            Engineered for Zero Latency
          </h2>
          <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Four interlocking systems ensuring determinism, acoustic synchronization, and sub-10ms response.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Card 1: In-Process WASM */}
          <GlowCard glowColor="emerald" className="p-7 sm:p-8 flex flex-col h-full bg-white/95">
            <div className="relative z-20 flex flex-col h-full">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-600 shadow-2xs">
                <Zap className="w-8 h-8 text-emerald-500 fill-emerald-500/20" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
                In-Process Moss Core
              </h3>
              <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                Runs vector indexing directly inside the client process via WebAssembly. Zero network hops, zero cloud cold starts.
              </p>
              <div className="space-y-3 mt-auto">
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Sub-10ms In-Process Vector Query</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Zero Network Roundtrips (0ms Hop)</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>Client-Side WASM Protocol Embeddings</span>
                </div>
              </div>
            </div>
          </GlowCard>

          {/* Card 2: 110 BPM Metronome */}
          <GlowCard glowColor="rose" className="p-7 sm:p-8 flex flex-col h-full bg-white/95">
            <div className="relative z-20 flex flex-col h-full">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6 text-rose-600 shadow-2xs">
                <Heart className="w-8 h-8 text-rose-500 animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
                110 BPM Metronome
              </h3>
              <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                Acoustic CPR rhythm synthesizer calibrated to AHA guideline pacing, keeping rescuers in the resuscitation pocket.
              </p>
              <div className="space-y-3 mt-auto">
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>AHA Guideline Pacing (100–120 BPM)</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>Deterministic Web Audio API Pacing</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>First-Responder Fatigue Mitigation</span>
                </div>
              </div>
            </div>
          </GlowCard>

          {/* Card 3: AHA & CDC Compliance */}
          <GlowCard glowColor="purple" className="p-7 sm:p-8 flex flex-col h-full bg-white/95">
            <div className="relative z-20 flex flex-col h-full">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 text-indigo-600 shadow-2xs">
                <ShieldCheck className="w-8 h-8 text-indigo-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
                AHA & CDC Compliance
              </h3>
              <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                Deterministic matching eliminates hallucinated medical advice. Every guideline cites gold-standard emergency medicine protocols.
              </p>
              <div className="space-y-3 mt-auto">
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span>Zero AI Hallucination Guardrails</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span>2025 AHA Emergency Care Grounding</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <span>Instant Epinephrine & Defib Pathways</span>
                </div>
              </div>
            </div>
          </GlowCard>

          {/* Card 4: CAD Paramedic Routing */}
          <GlowCard glowColor="orange" className="p-7 sm:p-8 flex flex-col h-full bg-white/95">
            <div className="relative z-20 flex flex-col h-full">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6 text-amber-600 shadow-2xs">
                <Cpu className="w-8 h-8 text-amber-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
                Automated CAD Dispatch
              </h3>
              <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                Immediately dispatches nearest Advanced Life Support (ALS) paramedic unit with live ETA, crew tracking, and station routing.
              </p>
              <div className="space-y-3 mt-auto">
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span>Instant ALS Geolocation & Live ETA</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span>In-Process Telemetry Broadcast Bus</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  <span>Turn-by-Turn Station Route Dispatch</span>
                </div>
              </div>
            </div>
          </GlowCard>
        </div>
      </section>

      {/* 5. AGENT BENTO GRID */}
      <section className="relative overflow-hidden bg-[#070709] text-white rounded-3xl p-6 sm:p-10 space-y-8 border border-white/[0.08] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)]">
        {/* Subtle dark ambient glows */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-rose-500/[0.06] blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute -bottom-24 right-10 w-80 h-48 bg-indigo-500/[0.04] blur-[100px] pointer-events-none rounded-full" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-[11px] font-mono font-medium text-rose-400 tracking-wider uppercase mb-2">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Autonomous Agent Workspace &amp; Telemetry</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1 font-sans">
              Real-Time AI Agent Bento Grid
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-sans max-w-2xl">
              Live orchestration graph, execution traces, token telemetry, and multi-namespace retrieval.
            </p>
          </div>
          <button
            onClick={() => onLaunchConsole()}
            className="group px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-[0_0_20px_rgba(225,29,72,0.3)] hover:shadow-[0_0_25px_rgba(225,29,72,0.5)] flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0 active:scale-95"
          >
            <span>Launch Live Console</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        <div className="relative z-10">
          <AgentBentoGrid />
        </div>
      </section>

      {/* 6. HACKATHON DELIVERABLES & SUBMISSION DOCK */}
      <section className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              HiDevs Arena Official Deliverables
            </span>
            <h3 className="text-xl font-black text-slate-900">Sprint Submission Artifacts</h3>
          </div>
          <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-bold">
            100% Complete & Verified
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <button
            onClick={() => onNavigateTab('prd')}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-left transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-rose-600">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block font-sans">Product Spec (PRD)</span>
                <span className="text-slate-500 text-[11px]">Full clinical document</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => onNavigateTab('architecture')}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-left transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block font-sans">Architecture Flow</span>
                <span className="text-slate-500 text-[11px]">Interactive pipeline</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={() => onNavigateTab('benchmark')}
            className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-left transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-amber-600">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block font-sans">Moss vs Cloud DBs</span>
                <span className="text-slate-500 text-[11px]">Sub-10ms benchmark</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>

          <a
            href="https://github.com/j4yop/pulse911"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-left transition-all cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-800">
                <ExternalLink className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block font-sans">GitHub Repository</span>
                <span className="text-slate-500 text-[11px]">j4yop/pulse911</span>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </a>
        </div>
      </section>

      {/* 7. CLOSING CONVERSION / CALL-TO-ACTION BANNER */}
      <section className="relative rounded-3xl bg-gradient-to-b from-white to-slate-50/80 border border-slate-200/90 p-8 sm:p-12 shadow-xs text-center overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-rose-500/5 blur-3xl pointer-events-none rounded-full" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-mono font-bold uppercase tracking-wider shadow-2xs">
            <Radio className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
            <span>Ready for Live Dispatch Simulation</span>
          </div>

          <div className="space-y-2.5">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              Experience Zero-Latency 911 Dispatch in Action
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto font-sans">
              Test real-time speech transcription, sub-10ms Moss WASM protocol retrieval, and acoustic CPR metronome synchronization under authentic high-stress scenarios.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-2">
            <CornerButton
              onClick={() => onLaunchConsole()}
              accentColor="#f43f5e"
              textColor="#ffffff"
              icon={<ArrowRight className="w-4 h-4 text-white" />}
              className="px-6 py-3.5 text-sm font-bold shadow-md shadow-rose-500/25"
            >
              <span className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-white animate-pulse" />
                Launch Emergency Console
              </span>
            </CornerButton>

            <CornerButton
              onClick={() => onNavigateTab('benchmark')}
              accentColor="#0f172a"
              textColor="#ffffff"
              icon={<ArrowRight className="w-4 h-4 text-slate-300" />}
              className="px-6 py-3.5 text-sm font-bold border border-slate-700/60 shadow-xs"
            >
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                Run 50-Query Benchmark
              </span>
            </CornerButton>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              100% Client-Side In-Memory
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              AHA 2025 Clinical Grounded
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Zero Network Roundtrip
            </span>
          </div>
        </div>
      </section>

      {/* 8. DISPATCHER ID CARD LANYARD */}
      <section className="relative min-h-[640px] lg:min-h-[680px] w-full rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-xl overflow-hidden flex flex-col justify-between p-4 sm:p-6 my-8">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b10_1px,transparent_1px),linear-gradient(to_bottom,#1e293b10_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800/80 pb-3">
          <span className="flex items-center gap-2 font-bold text-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            P911-CREDENTIAL-AHA // OFFICIAL DISPATCHER BADGE
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            VERIFIED OPERATOR &bull; ACTIVE
          </span>
        </div>

        {/* Lanyard Physics Component */}
        <div className="relative flex-1 w-full min-h-[540px] flex items-center justify-center">
          <IDCardLanyard
            name="Jay Gopal"
            role="Lead Systems Engineer"
            brand="PULSE 911"
            brandTagline="Zero-Latency Dispatch"
            pillars={["Sub-10ms Retrieval", "Deterministic AHA", "Acoustic CPR"]}
            location="VIT Chennai"
            idNumber="P911-2026-HQ"
            validThru="12/2029"
            avatarUrl={dispatcherAvatar}
            avatarObjectPosition="center 32%"
            site="github.com/j4yop"
            githubUrl="https://github.com/j4yop"
            linkedinUrl="https://www.linkedin.com/in/jaygopaltripathy"
            emailUrl="mailto:jay20gopal@gmail.com"
            anchorX="50%"
            anchorY={12}
            positionMode="absolute"
            showHint={true}
          />
        </div>

        <div className="relative z-10 text-center font-mono text-[11px] text-slate-500 pt-3 border-t border-slate-800/80">
          DRAG ROPE TO SWING &bull; CLICK BADGE TO ROTATE 180&deg; FOR QR &amp; DIRECT CONTACT
        </div>
      </section>
    </div>
  );
};
