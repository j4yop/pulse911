import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  Zap,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Radio,
  Truck,
  Heart,
  Volume2,
  VolumeX,
  Play,
  Square,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { EmergencyProtocol, MossQueryResult, DispatchedUnit } from '../types';
import { audioService } from '../engine/speechSimulation';
import { CopilotCoachPanel } from './CopilotCoachPanel';

interface DispatcherHUDProps {
  queryResult: MossQueryResult | null;
  dispatchedUnit: DispatchedUnit | null;
  onTriggerMetronome: (active: boolean) => void;
  isMetronomeActive: boolean;
  transcript: string;
  requestId: number;
}

export const DispatcherHUD: React.FC<DispatcherHUDProps> = ({
  queryResult,
  dispatchedUnit,
  onTriggerMetronome,
  isMetronomeActive,
  transcript,
  requestId,
}) => {
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});

  const protocol = queryResult?.protocol;

  const toggleStep = (idx: number) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <div className="double-bezel-shell flex flex-col min-h-[680px] xl:h-[820px]">
      <div className="double-bezel-core flex-1 flex flex-col overflow-hidden">
        {/* HUD Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 font-sans">
                  Dispatcher Clinical Mission HUD
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ZERO LATENCY
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                AHA Protocol Grounding &bull; Sub-10ms In-Memory Retrieval
              </span>
            </div>
          </div>

          {/* Moss Performance Badge */}
          {queryResult && (
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-emerald-800 flex items-center gap-1.5 font-bold shadow-2xs">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Moss: {queryResult.latencyMs.toFixed(2)} ms</span>
              </div>
              <span
                className={`text-[10px] px-2.5 py-1 rounded-full border font-bold ${
                  queryResult.engine.startsWith('Moss')
                    ? 'text-emerald-700 bg-emerald-50/80 border-emerald-200'
                    : 'text-amber-700 bg-amber-50 border-amber-200'
                }`}
                title={queryResult.engine}
              >
                {queryResult.engine.startsWith('Moss') ? 'MOSS RUNTIME' : 'LOCAL FALLBACK'} &bull; {(queryResult.score * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs font-sans">
          <AnimatePresence mode="wait">
            {!protocol ? (
              <motion.div
                key="cad-standby"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8 space-y-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shadow-2xs">
                  <Radio className="w-7 h-7 stroke-1 animate-pulse text-slate-500" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-base">CAD Standby Mode</p>
                  <p className="text-xs text-slate-500 max-w-sm mt-1.5 leading-relaxed">
                    Select an emergency scenario from the left panel to observe sub-10ms Moss semantic retrieval of clinical protocols and unit dispatch.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={protocol.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Active Protocol Header Card */}
                <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 font-bold uppercase tracking-wide">
                          {protocol.triageLevel}
                        </span>
                        <span className="text-[10px] font-mono text-slate-600 bg-white px-2.5 py-0.5 rounded-full border border-slate-200 font-bold">
                          {protocol.code}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight font-sans">{protocol.title}</h3>
                    </div>

                    {/* CPR Metronome Trigger (If cardiac) */}
                    {protocol.cadenceBpm && (
                      <button
                        onClick={() => onTriggerMetronome(!isMetronomeActive)}
                        className={`px-3.5 py-2 rounded-full border text-xs font-bold font-mono flex items-center gap-2 transition-all cursor-pointer ${
                          isMetronomeActive
                            ? 'bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-600/30 animate-pulse'
                            : 'btn-tactile bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-2xs'
                        }`}
                      >
                        <motion.div
                          animate={isMetronomeActive ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                          transition={isMetronomeActive ? { repeat: Infinity, duration: 60 / protocol.cadenceBpm, ease: 'easeInOut' } : {}}
                        >
                          <Heart className={`w-4 h-4 ${isMetronomeActive ? 'text-white fill-white' : 'text-rose-600'}`} />
                        </motion.div>
                        <span>{isMetronomeActive ? `Active (${protocol.cadenceBpm} BPM)` : `CPR Rhythm (${protocol.cadenceBpm} BPM)`}</span>
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">{protocol.clinicalSummary}</p>
                </div>

                {/* AI Spoken Instruction Banner */}
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2 text-rose-950 shadow-2xs">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-800">
                    <span className="flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-rose-600" />
                      Live Verbal Instruction Directive:
                    </span>
                    <span className="text-[10px] font-mono text-rose-700 uppercase bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200 font-bold">
                      Direct In-Ear Dispatch
                    </span>
                  </div>
                  <p className="text-xs font-mono leading-relaxed bg-white p-3.5 rounded-xl border border-rose-200/80 text-slate-900 shadow-2xs font-medium">
                    "{protocol.verbalResponseText}"
                  </p>
                </div>

                {/* Async AI Coaching — enrichment only, never in the critical path */}
                <CopilotCoachPanel transcript={transcript} protocol={protocol} requestId={requestId} />

                {/* Immediate Action Checklist */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Life-Saving Clinical Actions:
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {Object.values(checkedSteps).filter(Boolean).length} / {protocol.immediateActions.length} Verified
                    </span>
                  </div>

                  <div className="space-y-2">
                    {protocol.immediateActions.map((action, idx) => {
                      const isChecked = !!checkedSteps[idx];
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleStep(idx)}
                          className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all cursor-pointer select-none ${
                            isChecked
                              ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900 line-through opacity-75'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 text-slate-800 shadow-2xs'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="mt-0.5 rounded border-slate-300 bg-white text-emerald-600 pointer-events-none"
                          />
                          <span className="leading-snug flex-1 font-medium">{action}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Contraindications & Critical Warnings */}
                {protocol.contraindications.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-2 shadow-2xs">
                    <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5 font-mono uppercase">
                      <AlertOctagon className="w-3.5 h-3.5 text-amber-600" />
                      Clinical Contraindications & Warnings:
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-amber-950 text-[11px] font-mono">
                      {protocol.contraindications.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CAD Automatic Unit Dispatch Card */}
                {dispatchedUnit && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-900">CAD Dispatched Unit: {dispatchedUnit.name}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                        {dispatchedUnit.status} &bull; ETA {dispatchedUnit.etaMinutes}m (simulated)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="block text-slate-400">Unit Type:</span>
                        <span className="text-slate-800 font-bold">{dispatchedUnit.type}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="block text-slate-400">Base Station:</span>
                        <span className="text-slate-800 font-bold">{dispatchedUnit.station}</span>
                      </div>
                      <div className="col-span-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="block text-slate-400">Assigned Equipment:</span>
                        <span className="text-emerald-700 font-bold">
                          {protocol.unitRecommendation.requiredEquipment.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Source Citations */}
                <div className="text-[10px] font-mono text-slate-400 pt-2.5 border-t border-slate-100">
                  Authority Source: {protocol.citations}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
