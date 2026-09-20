import React, { useState } from 'react';
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
  CheckCircle2
} from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const [selectedPhase, setSelectedPhase] = useState<number>(3);

  const phases = [
    {
      phase: 1,
      title: 'Caller Voice Ingestion',
      component: 'LiveKit WebRTC Audio Stream',
      latency: '~70 ms',
      description: 'The distressed caller speaks over mobile phone or web client. LiveKit manages WebRTC transport with Opus audio compression and ultra-low jitter buffers.',
      guarantee: 'Continuous bidirectional audio pipe without packet loss.',
    },
    {
      phase: 2,
      title: 'Real-Time Streaming STT',
      component: 'VAD + Deepgram / Groq Whisper',
      latency: '~80 ms',
      description: 'Audio frames are tokenized in real-time. Voice Activity Detection (VAD) detects speech boundaries and streams incremental word transcripts.',
      guarantee: 'Sub-100ms transcript availability.',
    },
    {
      phase: 3,
      title: 'Moss Semantic Retrieval Core',
      component: 'Moss (YC F25) In-Memory Runtime',
      latency: '3 - 5 ms',
      description: 'The moment medical keywords or distress phrases arrive, Moss executes in-memory vector similarity over AHA emergency protocols and AED locations without touching an external network database.',
      guarantee: 'Sub-10ms hard mathematical latency guarantee.',
    },
    {
      phase: 4,
      title: 'Dual-Channel Real-Time Dispatch',
      component: 'LiveKit Voice Synth + CAD HUD Push',
      latency: '~100 ms',
      description: 'Simultaneously streams authoritative voice instructions directly into the caller’s ear (<260ms total turn-around) while dispatching nearest ALS paramedics on the operator HUD.',
      guarantee: 'Fits well within the human 300ms conversational turn-taking ceiling.',
    },
  ];

  return (
    <div className="max-w-[1250px] mx-auto space-y-8 pb-16 font-sans">
      {/* Header */}
      <div className="text-center space-y-3 pt-4 sm:pt-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
          <Layers className="w-3.5 h-3.5" />
          <span>System Architecture & Critical Path Breakdown</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Pulse911 Zero-Latency Pipeline
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
          How colocating the retrieval layer with the application via <strong>Moss (YC F25)</strong> eliminates 200ms of network latency from the emergency voice loop.
        </p>
      </div>

      {/* Interactive Phase Stepper */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {phases.map((p) => {
          const isSelected = selectedPhase === p.phase;
          return (
            <button
              key={p.phase}
              onClick={() => setSelectedPhase(p.phase)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'border-rose-500 bg-rose-500/10 shadow-lg'
                  : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                    Phase {p.phase}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    p.phase === 3 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {p.latency}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-white mb-1">{p.title}</h3>
                <p className="text-[11px] font-mono text-slate-400">{p.component}</p>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-800 text-[10px] font-mono text-rose-400 flex items-center justify-between">
                <span>Inspect Layer</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Phase Detail Showcase */}
      {phases.find((p) => p.phase === selectedPhase) && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono text-rose-400 font-bold uppercase tracking-wider block">
                Detailed Component Inspection &bull; Phase {selectedPhase}
              </span>
              <h2 className="text-xl font-bold text-white">
                {phases[selectedPhase - 1].title} ({phases[selectedPhase - 1].component})
              </h2>
            </div>
            <div className="bg-slate-950 border border-slate-800 px-3 py-1 rounded-xl text-emerald-400 font-mono text-xs font-bold w-fit">
              Layer Budget: {phases[selectedPhase - 1].latency}
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {phases[selectedPhase - 1].description}
          </p>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Operational Guarantee: <strong className="text-white">{phases[selectedPhase - 1].guarantee}</strong></span>
          </div>
        </div>
      )}

      {/* Tech Stack Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
          <Server className="w-4 h-4 text-rose-500" />
          Technical Stack & Architectural Roles
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <span className="text-emerald-400 font-bold block">Moss (YC F25)</span>
            <span className="text-slate-400 block text-[11px]">Sub-10ms in-memory semantic retrieval layer. No vector DB network overhead.</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <span className="text-sky-400 font-bold block">LiveKit WebRTC</span>
            <span className="text-slate-400 block text-[11px]">Real-time voice streaming with ultra-low jitter buffers and VAD.</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <span className="text-amber-400 font-bold block">Groq / Cartesia</span>
            <span className="text-slate-400 block text-[11px]">Sub-100ms LLM Time-To-First-Token and streaming audio generation.</span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
            <span className="text-rose-400 font-bold block">React 19 + Next.js</span>
            <span className="text-slate-400 block text-[11px]">Mission-critical CAD interface with real-time audio canvas visualization.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
