import React from 'react';
import {
  Activity,
  Zap,
  Volume2,
  VolumeX,
  Layers,
  FileText,
  BarChart3,
  PhoneCall,
  Flame,
  Radio
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
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 py-2.5 sticky top-0 z-50">
      <div className="max-w-[1750px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Brand identity */}
        <div className="flex items-center justify-between w-full lg:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-inner">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white">
                  Pulse<span className="text-rose-500">911</span>
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Zero-Latency CAD
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-medium px-2 py-0.5 rounded-md border ${
                    isCallActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isCallActive ? 'bg-emerald-500 animate-ping' : 'bg-slate-500'
                    }`}
                  ></span>
                  {isCallActive ? 'Emergency Call Active' : 'Dispatch Standby'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal">
                Sub-10ms clinical triage & voice dispatch copilot &bull; Powered by <strong>Moss (YC F25)</strong>
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            onClick={() => onSelectTab('console')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'console'
                ? 'bg-rose-600 text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Emergency Console</span>
          </button>
          <button
            onClick={() => onSelectTab('benchmark')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'benchmark'
                ? 'bg-rose-600 text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Moss vs Vector DBs</span>
          </button>
          <button
            onClick={() => onSelectTab('architecture')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'architecture'
                ? 'bg-rose-600 text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Architecture Flow</span>
          </button>
          <button
            onClick={() => onSelectTab('prd')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'prd'
                ? 'bg-rose-600 text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Product Spec (PRD)</span>
          </button>
        </nav>

        {/* Live Metrics & Utilities HUD */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Moss Latency Meter — honest states only */}
          <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-inner font-mono text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Retrieval:
            </span>
            <span className="text-emerald-400 font-bold tabular-nums">
              {latencyMs != null ? `${latencyMs.toFixed(2)} ms` : '— ms'}
            </span>
            {latencyMs == null ? (
              <span className="text-[9px] uppercase px-1.5 py-0.5 bg-slate-800/60 text-slate-400 rounded border border-slate-700 font-semibold">
                Awaiting first query
              </span>
            ) : engineLabel?.toLowerCase().includes('fallback') ? (
              <span className="text-[9px] uppercase px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded border border-amber-500/20 font-semibold">
                Local Fallback
              </span>
            ) : (
              <span className="text-[9px] uppercase px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20 font-semibold">
                Moss Runtime · Measured
              </span>
            )}
          </div>

          {/* Spoken Voice Toggle */}
          <button
            onClick={onToggleAudioFeedback}
            title={audioFeedbackEnabled ? 'Mute AI Voice Instruction' : 'Enable AI Voice Instruction'}
            className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {audioFeedbackEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* YC Fall 2026 Badge */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[11px]">
            <Flame className="w-3.5 h-3.5" />
            <span>YC Fall 2026 RFS</span>
          </div>
        </div>
      </div>
    </header>
  );
};
