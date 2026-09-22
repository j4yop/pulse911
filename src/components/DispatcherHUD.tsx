import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  CheckCircle2,
  AlertOctagon,
  Truck,
  Heart,
  Radio,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { EmergencyProtocol, MossQueryResult, DispatchedUnit } from '../types';
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
    <div className="clean-card flex flex-col min-h-[640px] overflow-hidden">
      {/* HUD Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Dispatcher Clinical HUD</h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Sub-10ms Retrieval
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Automated protocol matching & unit dispatch</p>
          </div>
        </div>

        {/* Moss Latency Pill */}
        {queryResult && (
          <div className="flex items-center gap-2">
            <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full text-emerald-800 flex items-center gap-1.5 text-xs font-bold shadow-2xs">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Moss: {queryResult.latencyMs.toFixed(2)} ms</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-5">
        <AnimatePresence mode="wait">
          {!protocol ? (
            <motion.div
              key="standby"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 min-h-[400px]"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shadow-xs">
                <Radio className="w-7 h-7 stroke-1 animate-pulse text-slate-500" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-base">CAD Standby</p>
                <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                  Select an emergency scenario or speak into the microphone to observe sub-10ms Moss semantic retrieval of clinical protocols.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={protocol.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* Protocol Header Banner */}
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold uppercase">
                      {protocol.triageLevel}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 text-xs font-mono font-semibold">
                      {protocol.code}
                    </span>
                  </div>

                  {/* CPR Metronome Trigger (If cardiac) */}
                  {protocol.cadenceBpm && (
                    <button
                      onClick={() => onTriggerMetronome(!isMetronomeActive)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                        isMetronomeActive
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 animate-pulse'
                          : 'btn-tactile bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-2xs'
                      }`}
                    >
                      <motion.div
                        animate={isMetronomeActive ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                        transition={isMetronomeActive ? { repeat: Infinity, duration: 60 / protocol.cadenceBpm, ease: 'easeInOut' } : {}}
                      >
                        <Heart className={`w-4 h-4 ${isMetronomeActive ? 'text-white fill-white' : 'text-rose-600'}`} />
                      </motion.div>
                      <span>{isMetronomeActive ? `CPR Beating (${protocol.cadenceBpm} BPM)` : `Play CPR Rhythm (${protocol.cadenceBpm} BPM)`}</span>
                    </button>
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">{protocol.title}</h2>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{protocol.clinicalSummary}</p>
                </div>
              </div>

              {/* Immediate Action Checklist */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Life-Saving Clinical Actions:</span>
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
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
                        className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 transition-all cursor-pointer select-none ${
                          isChecked
                            ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900 line-through opacity-75'
                            : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50 text-slate-800 shadow-2xs'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 rounded border-slate-300 text-emerald-600 pointer-events-none"
                        />
                        <span className="leading-relaxed flex-1 font-medium">{action}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Paramedic Unit Auto-Dispatch Card */}
              {dispatchedUnit && (
                <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-900">CAD Dispatched: {dispatchedUnit.name}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                      {dispatchedUnit.status} &bull; ETA ~{dispatchedUnit.etaMinutes} mins
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/70 font-mono">
                    <span className="text-slate-400">Assigned Equipment: </span>
                    <span className="font-bold text-slate-800">{protocol.unitRecommendation.requiredEquipment.join(', ')}</span>
                  </div>
                </div>
              )}

              {/* Contraindications & Critical Warnings */}
              {protocol.contraindications.length > 0 && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3.5 space-y-1.5">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertOctagon className="w-4 h-4 text-amber-600" />
                    <span>Clinical Warnings & Contraindications:</span>
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-amber-950 text-xs leading-relaxed">
                    {protocol.contraindications.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Async AI Copilot Coach */}
              <CopilotCoachPanel transcript={transcript} protocol={protocol} requestId={requestId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
