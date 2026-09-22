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
    <div className="bg-white border border-slate-200/90 rounded-2xl flex flex-col h-[780px] overflow-hidden shadow-xs">
      {/* HUD Header */}
      <div className="px-4 py-3 border-b border-slate-200/80 bg-slate-50/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-2xs">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span>Dispatcher Clinical Mission HUD</span>
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">
              Deterministic Clinical Copilot &bull; Sub-10ms Protocol Retrieval
            </span>
          </div>
        </div>

        {/* Moss Performance Badge */}
        {queryResult && (
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <div className="bg-emerald-50 border border-emerald-200/90 px-3 py-1 rounded-lg text-emerald-700 flex items-center gap-1.5 font-bold shadow-2xs">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Moss Retrieval: {queryResult.latencyMs.toFixed(2)} ms</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded border font-medium ${
                queryResult.engine.startsWith('Moss')
                  ? 'text-emerald-700 bg-emerald-50/80 border-emerald-200'
                  : 'text-amber-700 bg-amber-50 border-amber-200'
              }`}
              title={queryResult.engine}
            >
              {queryResult.engine.startsWith('Moss') ? 'MOSS RUNTIME' : 'LOCAL FALLBACK'} &bull; Score: {(queryResult.score * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-sans">
        <AnimatePresence mode="wait">
          {!protocol ? (
            <motion.div
              key="cad-standby"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6 space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shadow-2xs">
                <Radio className="w-6 h-6 stroke-1 animate-pulse text-slate-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-700 text-sm">CAD Dispatch Standby</p>
                <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                  Select an emergency scenario from the left panel to trigger sub-10ms Moss semantic retrieval of clinical protocols and unit dispatch.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={protocol.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Active Protocol Header Card */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 font-bold uppercase tracking-wide">
                        {protocol.triageLevel}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                        {protocol.code}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">{protocol.title}</h3>
                  </div>

                  {/* CPR Metronome Trigger (If cardiac) */}
                  {protocol.cadenceBpm && (
                    <button
                      onClick={() => onTriggerMetronome(!isMetronomeActive)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                        isMetronomeActive
                          ? 'bg-rose-600 text-white border-rose-700 shadow-md shadow-rose-600/20'
                          : 'btn-tactile bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
                      }`}
                    >
                      <motion.div
                        animate={isMetronomeActive ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                        transition={isMetronomeActive ? { repeat: Infinity, duration: 60 / protocol.cadenceBpm, ease: 'easeInOut' } : {}}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isMetronomeActive ? 'text-white fill-white' : 'text-rose-500'}`} />
                      </motion.div>
                      <span>{isMetronomeActive ? `Metronome (${protocol.cadenceBpm} BPM)` : `CPR Rhythm (${protocol.cadenceBpm} BPM)`}</span>
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-normal">{protocol.clinicalSummary}</p>
              </div>

              {/* AI Spoken Instruction Banner */}
              <div className="bg-rose-50/80 border border-rose-200/90 rounded-xl p-3.5 space-y-1.5 text-rose-950 shadow-2xs">
                <div className="flex items-center justify-between text-xs font-bold text-rose-700">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-rose-600" />
                    Real-Time Voice Agent Output:
                  </span>
                  <span className="text-[10px] font-mono text-rose-600 uppercase bg-rose-100/60 px-2 py-0.5 rounded border border-rose-200">
                    Live Web Speech
                  </span>
                </div>
                <p className="text-xs font-mono leading-relaxed bg-white p-3 rounded-lg border border-rose-200/70 text-slate-800 shadow-2xs">
                  "{protocol.verbalResponseText}"
                </p>
              </div>

              {/* Async AI Coaching — enrichment only, never in the critical path */}
              <CopilotCoachPanel transcript={transcript} protocol={protocol} requestId={requestId} />

              {/* Immediate Action Checklist */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Immediate Life-Saving Clinical Actions:
                </h4>

                <div className="space-y-1.5">
                  {protocol.immediateActions.map((action, idx) => {
                    const isChecked = !!checkedSteps[idx];
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleStep(idx)}
                        className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all cursor-pointer select-none ${
                          isChecked
                            ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800 line-through opacity-75'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 text-slate-700 shadow-2xs'
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
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1.5 shadow-2xs">
                  <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5 font-mono uppercase">
                    <AlertOctagon className="w-3.5 h-3.5 text-amber-600" />
                    Clinical Contraindications & Warnings:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-amber-900 text-[11px] font-mono">
                    {protocol.contraindications.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CAD Automatic Unit Dispatch Card */}
              {dispatchedUnit && (
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-900">CAD Assigned Unit: {dispatchedUnit.name}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                      {dispatchedUnit.status} &bull; ETA {dispatchedUnit.etaMinutes}m (simulated)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div>
                      <span className="block text-slate-500">Unit Type:</span>
                      <span className="text-slate-800 font-medium">{dispatchedUnit.type}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500">Base Station:</span>
                      <span className="text-slate-800 font-medium">{dispatchedUnit.station}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-slate-500">Assigned Equipment:</span>
                      <span className="text-emerald-700 font-semibold">
                        {protocol.unitRecommendation.requiredEquipment.join(', ')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Source Citations */}
              <div className="text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-200">
                Authority Source: {protocol.citations}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
