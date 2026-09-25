import React from 'react';
import {
  Heart,
  Baby,
  Brain,
  AlertOctagon,
  ShieldAlert,
  Zap,
  Clock,
  ShieldCheck,
  Layers,
  Sparkles,
  Radio,
  HeartPulse,
  Volume2,
  VolumeX,
  RotateCcw,
  Activity,
} from 'lucide-react';
import { CallerPanel } from './CallerPanel';
import { DispatcherHUD } from './DispatcherHUD';
import { GlassDock, DockItem } from '@/components/ui/glass-dock';
import { CardSpotlight } from '@/components/ui/card-spotlight';
import { BorderBeam } from '@/components/ui/border-beam';
import { StatsCounter } from '@/components/ui/stats-counter';
import { EmergencyScenario, MossQueryResult, DispatchedUnit } from '../types';
import { EMERGENCY_SCENARIOS } from '../engine/emergencyProtocols';
import { cn } from '@/lib/utils';

const SCENARIO_PRESETS: Record<string, { code: string; glow: string }> = {
  scen_cardiac: { code: 'CODE: AHA-CPR-2025', glow: 'rgba(244, 63, 94, 0.22)' },
  scen_pediatric: { code: 'CODE: PEDS-SEIZURE', glow: 'rgba(245, 158, 11, 0.22)' },
  scen_stroke: { code: 'CODE: FAST-STROKE', glow: 'rgba(59, 130, 246, 0.22)' },
  scen_anaphylaxis: { code: 'CODE: SHOCK-AIRWAY', glow: 'rgba(217, 70, 239, 0.22)' },
  scen_digital_arrest: { code: 'CODE: CAD-DIGITAL-1', glow: 'rgba(16, 185, 129, 0.22)' },
};

const SCENARIO_ICONS: Record<string, React.ElementType> = {
  scen_cardiac: Heart,
  scen_pediatric: Baby,
  scen_stroke: Brain,
  scen_anaphylaxis: AlertOctagon,
  scen_digital_arrest: ShieldAlert,
};

export interface ConsoleViewProps {
  activeScenario: EmergencyScenario | null;
  currentTranscript: string;
  isProcessing: boolean;
  queryResult: MossQueryResult | null;
  dispatchedUnit: DispatchedUnit | null;
  isMetronomeActive: boolean;
  audioFeedbackEnabled: boolean;
  latencyMs: number | null;
  callRequestId: number;
  onProcessTranscript: (text: string, scenario?: EmergencyScenario) => void;
  onToggleMetronome: (active: boolean) => void;
  onToggleAudioFeedback: () => void;
  onClearCall: () => void;
}

/**
 * Emergency CAD Console — lazily loaded so its heavy panels, waveforms and
 * motion graphs never compile on the landing page's critical path.
 */
export const ConsoleView: React.FC<ConsoleViewProps> = ({
  activeScenario,
  currentTranscript,
  isProcessing,
  queryResult,
  dispatchedUnit,
  isMetronomeActive,
  audioFeedbackEnabled,
  latencyMs,
  callRequestId,
  onProcessTranscript,
  onToggleMetronome,
  onToggleAudioFeedback,
  onClearCall,
}) => {
  const dockItems: DockItem[] = [
    {
      id: 'scen_cardiac',
      title: 'Cardiac Arrest',
      subtitle: 'ESI-1 Ventricular Fibrillation',
      icon: Heart,
      isActive: activeScenario?.id === 'scen_cardiac',
      onClick: () => {
        const scen = EMERGENCY_SCENARIOS.find((s) => s.id === 'scen_cardiac');
        if (scen) onProcessTranscript(scen.callerSpeechTranscript, scen);
      },
    },
    {
      id: 'scen_pediatric',
      title: 'Pediatric Seizure',
      subtitle: 'ESI-1 Status Epilepticus',
      icon: Baby,
      isActive: activeScenario?.id === 'scen_pediatric',
      onClick: () => {
        const scen = EMERGENCY_SCENARIOS.find((s) => s.id === 'scen_pediatric');
        if (scen) onProcessTranscript(scen.callerSpeechTranscript, scen);
      },
    },
    {
      id: 'scen_stroke',
      title: 'Stroke Code FAST',
      subtitle: 'ESI-1 Hemiparesis',
      icon: Brain,
      isActive: activeScenario?.id === 'scen_stroke',
      onClick: () => {
        const scen = EMERGENCY_SCENARIOS.find((s) => s.id === 'scen_stroke');
        if (scen) onProcessTranscript(scen.callerSpeechTranscript, scen);
      },
    },
    {
      id: 'scen_anaphylaxis',
      title: 'Anaphylaxis',
      subtitle: 'ESI-1 Airway Stridor',
      icon: AlertOctagon,
      isActive: activeScenario?.id === 'scen_anaphylaxis',
      onClick: () => {
        const scen = EMERGENCY_SCENARIOS.find((s) => s.id === 'scen_anaphylaxis');
        if (scen) onProcessTranscript(scen.callerSpeechTranscript, scen);
      },
    },
    {
      id: 'scen_digital_arrest',
      title: 'Digital Arrest',
      subtitle: 'ESI-2 Trauma Triage',
      icon: ShieldAlert,
      isActive: activeScenario?.id === 'scen_digital_arrest',
      onClick: () => {
        const scen = EMERGENCY_SCENARIOS.find((s) => s.id === 'scen_digital_arrest');
        if (scen) onProcessTranscript(scen.callerSpeechTranscript, scen);
      },
    },
    {
      id: 'metronome',
      title: isMetronomeActive ? 'Stop CPR Metronome' : 'Start 110 BPM Metronome',
      subtitle: 'AHA Acoustic Pacer',
      icon: HeartPulse,
      isActive: isMetronomeActive,
      onClick: () => onToggleMetronome(!isMetronomeActive),
    },
    {
      id: 'tts_toggle',
      title: audioFeedbackEnabled ? 'Voice Guidance: ON' : 'Voice Guidance: MUTED',
      subtitle: 'Web Speech TTS',
      icon: audioFeedbackEnabled ? Volume2 : VolumeX,
      isActive: audioFeedbackEnabled,
      onClick: onToggleAudioFeedback,
    },
    {
      id: 'reset_call',
      title: 'Reset Session',
      subtitle: 'Standby Ready',
      icon: RotateCcw,
      isActive: false,
      onClick: onClearCall,
    },
  ];

  return (
    <div className="animate-appear space-y-6 pb-20 sm:pb-24">
      {/* Futuristic Mission Command Header Card */}
      <CardSpotlight
        spotlightColor="rgba(6, 182, 212, 0.14)"
        spotlightSize={450}
        className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/90 dark:border-slate-800 p-5 sm:p-6 shadow-lg shadow-slate-900/5 relative"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                </span>
                TACTICAL CAD HUD // ESI 1-5 ACTIVE
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <Radio className="w-3 h-3 text-cyan-500 animate-pulse" />
                16kHz WEBRTC AUDIO STREAM
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <Activity className="w-3 h-3 text-emerald-500" />
                ZERO-LATENCY MOSS WASM
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-sans">
                Zero-Latency Emergency Dispatch Console
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
              Sub-10ms deterministic clinical protocol retrieval powered by in-memory Moss WASM. Click any emergency scenario below or speak into the live microphone to test triage under the 300ms conversational turn-taking ceiling.
            </p>
          </div>

          {/* Live Mission Telemetry Badges */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1 lg:pt-0 shrink-0">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 shadow-2xs backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-bold text-slate-900 dark:text-white">ENGINE:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {queryResult?.engine?.includes('Moss') ? 'Moss WASM' : 'Moss Local'}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 shadow-2xs backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="font-bold text-slate-900 dark:text-white">LATENCY:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                <StatsCounter value={latencyMs !== null ? latencyMs : 0.1} decimals={1} suffix=" ms" />
              </span>
            </div>

            {isMetronomeActive && (
              <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs font-mono text-rose-700 dark:text-rose-300 shadow-2xs animate-pulse">
                <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                <span className="font-bold">110 BPM PACER</span>
              </div>
            )}
          </div>
        </div>
      </CardSpotlight>

      {/* Emergency Scenario Selector Cards */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Select Active Emergency Event:</span>
            <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hidden sm:inline">
              Deterministic Protocols
            </span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            Sub-10ms Moss semantic indexing
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
          {EMERGENCY_SCENARIOS.map((scen, idx) => {
            const isSelected = activeScenario?.id === scen.id;
            const Icon = SCENARIO_ICONS[scen.id] || Heart;
            const preset = SCENARIO_PRESETS[scen.id] || SCENARIO_PRESETS.scen_cardiac;

            return (
              <CardSpotlight
                key={scen.id}
                spotlightColor={preset.glow}
                spotlightSize={220}
                className={cn(
                  'p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative shadow-xs backdrop-blur-md group',
                  isSelected
                    ? 'bg-white/95 dark:bg-slate-900/95 border-rose-500/80 ring-2 ring-rose-500/20 shadow-md shadow-rose-500/10'
                    : 'bg-white/75 hover:bg-white/90 dark:bg-slate-900/75 dark:hover:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                )}
                onClick={() => onProcessTranscript(scen.callerSpeechTranscript, scen)}
              >
                {isSelected && (
                  <BorderBeam size={140} duration={6} borderWidth={1.5} colorFrom="#f43f5e" colorTo="#06b6d4" />
                )}

                <div className="flex items-center justify-between w-full mb-3 relative z-10">
                  <div
                    className={cn(
                      'w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all duration-300',
                      isSelected
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-500/30 scale-105'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:scale-105'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border',
                        scen.triagePriority.includes('1')
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                      )}
                    >
                      {scen.triagePriority.split(' ')[0]}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 hidden sm:inline">0{idx + 1}</span>
                  </div>
                </div>

                <div className="space-y-1 relative z-10">
                  <div className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 tracking-wider truncate">
                    {preset.code}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {scen.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-snug font-sans">
                    {scen.tagline}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400 relative z-10">
                  <span className="flex items-center gap-1">
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        isSelected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'
                      )}
                    />
                    {isSelected ? 'ACTIVE ON CAD' : 'CLICK TO LOAD'}
                  </span>
                  <span className="text-slate-400 group-hover:text-slate-600 transition-colors">&rarr;</span>
                </div>
              </CardSpotlight>
            );
          })}
        </div>
      </div>

      {/* The 2-Column Clinical Dispatch Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
        {/* Left Channel: The 911 Caller Audio & Conversation */}
        <div className="space-y-2 min-w-0">
          <div className="flex items-center justify-between px-1 text-xs font-mono text-slate-500 gap-2">
            <span className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 truncate">
              <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 animate-pulse shrink-0" />
              <span className="truncate">CH-01 // CALLER TELEPHONY & SPEECH STREAM</span>
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:inline shrink-0">16kHz PCM &bull; LIVE AUDIO</span>
          </div>
          <CallerPanel
            onProcessTranscript={(txt, scen) => onProcessTranscript(txt, scen)}
            isProcessing={isProcessing}
            activeScenario={activeScenario}
            currentTranscript={currentTranscript}
            spokenInstruction={queryResult?.protocol.verbalResponseText}
            onClearCall={onClearCall}
          />
        </div>

        {/* Right Channel: The Dispatcher Mission HUD & Protocol */}
        <div className="space-y-2 min-w-0">
          <div className="flex items-center justify-between px-1 text-xs font-mono text-slate-500 gap-2">
            <span className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 truncate">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate">CH-02 // DETERMINISTIC CAD CLINICAL PROTOCOL</span>
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold hidden sm:inline shrink-0">
              SUB-10MS RETRIEVAL
            </span>
          </div>
          <DispatcherHUD
            queryResult={queryResult}
            dispatchedUnit={dispatchedUnit}
            onTriggerMetronome={onToggleMetronome}
            isMetronomeActive={isMetronomeActive}
            transcript={currentTranscript}
            requestId={callRequestId}
          />
        </div>
      </div>

      {/* Bottom Telemetry Ribbon */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Moss Retrieval</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
              <StatsCounter
                value={queryResult ? queryResult.latencyMs : latencyMs !== null ? latencyMs : 0.1}
                decimals={1}
                suffix=" ms"
              />
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 shrink-0 shadow-2xs">
            <Clock className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Turnaround Target</span>
            <span className="font-extrabold text-slate-900 dark:text-white text-sm">
              &lt; <StatsCounter value={300} decimals={0} suffix=" ms" /> Ceiling
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 shrink-0 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Triage Protocol</span>
            <span className="font-extrabold text-slate-900 dark:text-white text-sm">AHA / CDC Grounded</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 shrink-0 shadow-2xs">
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Architecture</span>
            <span className="font-extrabold text-slate-900 dark:text-white text-sm">Local-First WASM</span>
          </div>
        </div>
      </div>

      {/* Floating Tactical Glass Dock for Rapid Dispatch Controls */}
      <div className="sticky bottom-4 sm:bottom-6 z-40 pt-4 flex justify-center pointer-events-none">
        <div className="pointer-events-auto shadow-2xl max-w-full">
          <GlassDock items={dockItems} />
        </div>
      </div>
    </div>
  );
};

export default ConsoleView;