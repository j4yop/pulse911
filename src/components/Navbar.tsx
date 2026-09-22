import React from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  Zap,
  Volume2,
  VolumeX,
  Layers,
  FileText,
  BarChart3,
  Radio,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'console' | 'benchmark' | 'architecture' | 'prd';
  onSelectTab: (tab: 'console' | 'benchmark' | 'architecture' | 'prd') => void;
  latencyMs: number | null;
  engineLabel: string | null;
  isCallActive: boolean;
  audioFeedbackEnabled: boolean;
  onToggleAudioFeedback: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  latencyMs,
  engineLabel,
  isCallActive,
  audioFeedbackEnabled,
  onToggleAudioFeedback,
}) => {
  const tabs = [
    { id: 'console', label: 'Emergency Console', icon: Radio },
    { id: 'benchmark', label: 'Moss vs Cloud DBs', icon: BarChart3 },
    { id: 'architecture', label: 'Architecture Flow', icon: Layers },
    { id: 'prd', label: 'Product Spec', icon: FileText },
  ] as const;

  return (
    <header className="sticky top-3 z-50 px-3 sm:px-6 max-w-[1750px] mx-auto w-full transition-all">
      <div className="bg-white/90 backdrop-blur-2xl border border-slate-200/90 rounded-2xl lg:rounded-full px-4 sm:px-6 py-2.5 shadow-[0_12px_36px_-6px_rgba(15,23,42,0.08),0_0_0_1px_rgba(255,255,255,0.8)_inset] flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center justify-between w-full lg:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-500/25 ring-2 ring-rose-100">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-slate-900 font-sans">
                  Pulse<span className="text-rose-600">911</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white tracking-wide shadow-2xs">
                  AHA &bull; MOSS
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border transition-all ${
                    isCallActive
                      ? 'bg-rose-50 text-rose-700 border-rose-200/80 shadow-xs'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isCallActive ? 'bg-rose-600 animate-ping' : 'bg-slate-400'
                    }`}
                  />
                  {isCallActive ? 'CAD INGESTION LIVE' : 'CAD STANDBY'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Sub-10ms Emergency Triage Copilot &bull; Powered by <strong className="text-slate-800 font-semibold">Moss (YC F25)</strong>
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs with Motion Layout Indicator */}
        <nav className="flex items-center gap-1 bg-slate-100/90 p-1.5 rounded-xl lg:rounded-full border border-slate-200/80 text-xs font-semibold shadow-inner">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelectTab(t.id)}
                className={`relative px-4 py-1.5 rounded-lg lg:rounded-full transition-colors flex items-center gap-1.5 cursor-pointer z-10 btn-tactile ${
                  isActive ? 'text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavTabPill"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                    className="absolute inset-0 bg-white rounded-lg lg:rounded-full shadow-xs border border-slate-200/70 -z-10"
                  />
                )}
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-600' : 'text-slate-400'}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Live Metrics & Utilities HUD */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Moss Latency Meter */}
          <div className="bg-emerald-50/70 border border-emerald-200 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-2xs font-mono text-[11px]">
            <span className="text-emerald-800 flex items-center gap-1 font-semibold">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Moss Retrieval:
            </span>
            <span className="text-emerald-700 font-extrabold tabular-nums">
              {latencyMs != null ? `${latencyMs.toFixed(2)} ms` : '— ms'}
            </span>
            {latencyMs == null ? (
              <span className="text-[9px] uppercase px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded-full font-bold">
                Standby
              </span>
            ) : engineLabel?.toLowerCase().includes('fallback') ? (
              <span className="text-[9px] uppercase px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold">
                Local Fallback
              </span>
            ) : (
              <span className="text-[9px] uppercase px-2 py-0.5 bg-emerald-600 text-white rounded-full font-bold shadow-2xs">
                In-Memory WASM
              </span>
            )}
          </div>

          {/* Spoken Voice Toggle */}
          <button
            onClick={onToggleAudioFeedback}
            title={audioFeedbackEnabled ? 'Mute Voice Agent' : 'Unmute Voice Agent'}
            className={`btn-tactile px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
              audioFeedbackEnabled
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
            }`}
          >
            {audioFeedbackEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[11px] font-mono font-medium">Voice Audio: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-mono font-medium">Voice Audio: Muted</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
