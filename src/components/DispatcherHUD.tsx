import React, { useState } from 'react';
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

interface DispatcherHUDProps {
  queryResult: MossQueryResult | null;
  dispatchedUnit: DispatchedUnit | null;
  onTriggerMetronome: (active: boolean) => void;
  isMetronomeActive: boolean;
}

export const DispatcherHUD: React.FC<DispatcherHUDProps> = ({
  queryResult,
  dispatchedUnit,
  onTriggerMetronome,
  isMetronomeActive,
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[780px] overflow-hidden shadow-2xl">
      {/* HUD Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <span>Dispatcher Clinical Mission HUD</span>
            </h2>
            <span className="text-[10px] text-slate-400 font-mono">
              Real-Time Protocol Copilot &bull; Zero Latency
            </span>
          </div>
        </div>

        {/* Moss Performance Badge */}
        {queryResult && (
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <div className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-lg text-emerald-400 flex items-center gap-1.5 font-bold shadow-inner">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Moss Retrieval: {queryResult.latencyMs.toFixed(2)} ms</span>
            </div>
            <span className="text-[10px] text-slate-500 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
              Score: {(queryResult.score * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-sans">
        {!protocol ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-6 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
              <Radio className="w-6 h-6 stroke-1 animate-pulse" />
            </div>
            <div>
              <p className="font-semibold text-slate-200 text-sm">CAD Standby</p>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Select an emergency scenario from the left panel to observe sub-10ms Moss semantic retrieval of clinical protocols and unit dispatch.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Active Protocol Header Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 shadow-inner">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold uppercase">
                      {protocol.triageLevel}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{protocol.code}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{protocol.title}</h3>
                </div>

                {/* CPR Metronome Trigger (If cardiac) */}
                {protocol.cadenceBpm && (
                  <button
                    onClick={() => onTriggerMetronome(!isMetronomeActive)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                      isMetronomeActive
                        ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                    <span>{isMetronomeActive ? `Metronome (${protocol.cadenceBpm} BPM)` : `CPR Rhythm (${protocol.cadenceBpm} BPM)`}</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{protocol.clinicalSummary}</p>
            </div>

            {/* AI Spoken Instruction Banner */}
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 space-y-1.5 text-rose-100 shadow-inner">
              <div className="flex items-center justify-between text-xs font-bold text-rose-400">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-rose-400" />
                  Real-Time Voice Agent Output (Sub-250ms Turnaround):
                </span>
                <span className="text-[10px] font-mono text-rose-300 uppercase">Live Web Speech</span>
              </div>
              <p className="text-xs font-mono leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-rose-500/20 text-white">
                "{protocol.verbalResponseText}"
              </p>
            </div>

            {/* Immediate Action Checklist */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
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
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 line-through opacity-70'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700 text-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 rounded border-slate-700 bg-slate-900 text-emerald-500 pointer-events-none"
                      />
                      <span className="leading-snug flex-1">{action}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Contraindications & Critical Warnings */}
            {protocol.contraindications.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 space-y-1.5">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 font-mono uppercase">
                  <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
                  Clinical Contraindications & Warnings:
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] font-mono">
                  {protocol.contraindications.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* CAD Automatic Unit Dispatch Card */}
            {dispatchedUnit && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">CAD Assigned Unit: {dispatchedUnit.name}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                    {dispatchedUnit.status} &bull; ETA {dispatchedUnit.etaMinutes}m
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400">
                  <div>
                    <span className="block text-slate-500">Unit Type:</span>
                    <span className="text-slate-200">{dispatchedUnit.type}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500">Base Station:</span>
                    <span className="text-slate-200">{dispatchedUnit.station}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-slate-500">Assigned Equipment:</span>
                    <span className="text-emerald-400">
                      {protocol.unitRecommendation.requiredEquipment.join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Source Citations */}
            <div className="text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/80">
              Authority Source: {protocol.citations}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
