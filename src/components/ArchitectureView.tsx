import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers,
  Zap,
  PhoneCall,
  Activity,
  Server,
  Radio,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Mic,
  Volume2
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const [selectedPhase, setSelectedPhase] = useState<number>(3);

  const phases = [
    {
      phase: 1,
      title: 'Caller Voice Ingestion',
      component: 'LiveKit WebRTC Audio Stream',
      latency: '~70 ms',
      icon: Mic,
      description: 'The distressed caller speaks over mobile phone or web client. LiveKit manages WebRTC transport with Opus audio compression and ultra-low jitter buffers.',
      guarantee: 'Continuous bidirectional audio pipe without packet loss.',
    },
    {
      phase: 2,
      title: 'Real-Time Streaming STT',
      component: 'VAD + Deepgram / Groq Whisper',
      latency: '~80 ms',
      icon: Activity,
      description: 'Audio frames are tokenized in real-time. Voice Activity Detection (VAD) detects speech boundaries and streams incremental word transcripts.',
      guarantee: 'Sub-100ms transcript availability.',
    },
    {
      phase: 3,
      title: 'Moss Semantic Retrieval Core',
      component: 'Moss (YC F25) In-Memory Runtime',
      latency: '3 - 5 ms',
      icon: Cpu,
      description: 'The moment medical keywords or distress phrases arrive, Moss executes in-memory vector similarity over AHA emergency protocols and AED locations without touching an external network database.',
      guarantee: 'Sub-10ms hard mathematical latency guarantee.',
    },
    {
      phase: 4,
      title: 'Dual-Channel Real-Time Dispatch',
      component: 'LiveKit Voice Synth + CAD HUD Push',
      latency: '~100 ms',
      icon: Volume2,
      description: 'Simultaneously streams authoritative voice instructions directly into the caller’s ear (<260ms total turn-around) while dispatching nearest ALS paramedics on the operator HUD.',
      guarantee: 'Fits well within the human 300ms conversational turn-taking ceiling.',
    },
  ];

  return (
    <div className="max-w-[1250px] mx-auto space-y-8 pb-16 font-sans">
      {/* Header */}
      <div className="text-center space-y-3 pt-4 sm:pt-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold shadow-2xs">
          <Layers className="w-3.5 h-3.5 text-rose-600" />
          <span>System Architecture & Critical Path Breakdown</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Pulse911 Zero-Latency Pipeline
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          How colocating the retrieval layer with the application via <strong className="text-slate-900 font-semibold">Moss (YC F25)</strong> eliminates 200ms of network latency from the emergency voice loop.
        </p>
      </div>

      {/* Interactive Phase Stepper */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {phases.map((p) => {
          const isSelected = selectedPhase === p.phase;
          const PhaseIcon = p.icon;
          return (
            <motion.button
              key={p.phase}
              whileHover={{ y: -3, scale: 1.015 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={() => setSelectedPhase(p.phase)}
              className={`p-4 rounded-2xl border text-left transition-colors cursor-pointer flex flex-col justify-between btn-tactile relative ${
                isSelected
                  ? 'border-rose-500 bg-rose-50/70 shadow-xs ring-2 ring-rose-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold flex items-center gap-1.5">
                    <PhaseIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-rose-600' : 'text-slate-400'}`} />
                    Phase {p.phase}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-2xs ${
                    p.phase === 3
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {p.latency}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 mb-1">{p.title}</h3>
                <p className="text-[11px] font-mono text-slate-500">{p.component}</p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-200/80 text-[10px] font-mono text-rose-600 font-semibold flex items-center justify-between">
                <span>{isSelected ? 'Currently Inspecting' : 'Inspect Layer'}</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Selected Phase Detail Showcase */}
      <AnimatePresence mode="wait">
        {phases.find((p) => p.phase === selectedPhase) && (
          <motion.div
            key={selectedPhase}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
              <div>
                <span className="text-xs font-mono text-rose-600 font-bold uppercase tracking-wider block">
                  Detailed Component Inspection &bull; Phase {selectedPhase}
                </span>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
                  {phases[selectedPhase - 1].title} ({phases[selectedPhase - 1].component})
                </h2>
              </div>
              <div className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl text-emerald-700 font-mono text-xs font-bold w-fit shadow-2xs">
                Layer Budget: {phases[selectedPhase - 1].latency}
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-sans">
              {phases[selectedPhase - 1].description}
            </p>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 flex items-center gap-2 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Operational Guarantee: <strong className="text-slate-900">{phases[selectedPhase - 1].guarantee}</strong></span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tech Stack Matrix */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-mono flex items-center gap-2">
          <Server className="w-4 h-4 text-rose-600" />
          Technical Stack & Architectural Roles
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs hover:border-slate-300 transition-all">
            <span className="text-emerald-700 font-bold block text-xs">Moss (YC F25)</span>
            <span className="text-slate-600 block text-[11px] leading-relaxed">Sub-10ms in-memory semantic retrieval layer. No vector DB network overhead.</span>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs hover:border-slate-300 transition-all">
            <span className="text-sky-700 font-bold block text-xs">LiveKit WebRTC</span>
            <span className="text-slate-600 block text-[11px] leading-relaxed">Real-time voice streaming with ultra-low jitter buffers and VAD.</span>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs hover:border-slate-300 transition-all">
            <span className="text-amber-700 font-bold block text-xs">Groq / Cartesia</span>
            <span className="text-slate-600 block text-[11px] leading-relaxed">Sub-100ms LLM Time-To-First-Token and streaming audio generation.</span>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs hover:border-slate-300 transition-all">
            <span className="text-rose-700 font-bold block text-xs">React 19 + Vite</span>
            <span className="text-slate-600 block text-[11px] leading-relaxed">Mission-critical CAD interface with real-time audio canvas visualization.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
