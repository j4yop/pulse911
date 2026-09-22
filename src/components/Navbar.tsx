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
  Flame,
  ShieldAlert,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'console' | 'benchmark' | 'architecture' | 'prd';
  onSelectTab: (tab: 'console' | 'benchmark' | 'architecture' | 'prd') => void;
  /** Measured latency of the last query. `null` until the first query resolves — never a default number. */
  latencyMs: number | null;
  /** What served the last query (engine label), or `null` before the first query. */
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
    <header className="border-b border-slate-200/90 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-2.5 sticky top-0 z-50 shadow-xs">
      <div className="max-w-[1750px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center justify-between w-full lg:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-xs">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight text-slate-900">
                  Pulse<span className="text-rose-600">911</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/80">
                  Zero-Latency CAD
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border transition-colors ${
                    isCallActive
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isCallActive ? 'bg-rose-600 animate-ping' : 'bg-slate-400'
                    }`}
                  />
                  {isCallActive ? 'Emergency Active' : 'CAD Standby'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Sub-10ms clinical triage & voice dispatch copilot &bull; Powered by <strong className="text-slate-800 font-semibold">Moss (YC F25)</strong>
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs with Motion Layout Indicator */}
        <nav className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 text-xs font-semibold">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onSelectTab(t.id)}
                className={`relative px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer z-10 btn-tactile ${
                  isActive ? 'text-slate-900 font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavTabPill"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    className="absolute inset-0 bg-white rounded-lg shadow-xs border border-slate-200/60 -z-10"
                  />
                )}
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-600' : 'text-slate-500'}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Live Metrics & Utilities HUD */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Moss Latency Meter */}
          <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-2xs font-mono text-[11px]">
            <span className="text-slate-500 flex items-center gap-1 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Retrieval:
            </span>
            <span className="text-emerald-700 font-bold tabular-nums">
              {latencyMs != null ? `${latencyMs.toFixed(2)} ms` : '— ms'}
            </span>
            {latencyMs == null ? (
              <span className="text-[9px] uppercase px-1.5 py-0.5 bg-slate-200/70 text-slate-600 rounded border border-slate-300/80 font-bold">
                Standby
              </span>
            ) : engineLabel?.toLowerCase().includes('fallback') ? (
              <span className="text-[9px] uppercase px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded border border-amber-300 font-bold">
                Local Fallback
              </span>
            ) : (
              <span className="text-[9px] uppercase px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded border border-emerald-300 font-bold">
                Moss Runtime · Measured
              </span>
            )}
          </div>

          {/* Spoken Voice Toggle */}
          <button
            onClick={onToggleAudioFeedback}
            title={audioFeedbackEnabled ? 'Mute AI Voice Instruction' : 'Enable AI Voice Instruction'}
            className={`btn-tactile px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
              audioFeedbackEnabled
                ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800 shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-500'
            }`}
          >
            {audioFeedbackEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline text-[11px]">Voice: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline text-[11px]">Voice: OFF</span>
              </>
            )}
          </button>

          {/* YC Fall 2026 Badge */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-mono text-[11px] font-semibold shadow-2xs">
            <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
            <span>YC Fall 2026 RFS</span>
          </div>
        </div>
      </div>
    </header>
  );
};
