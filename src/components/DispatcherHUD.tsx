import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Zap,
  CheckCircle2,
  AlertOctagon,
  Truck,
  Heart,
  Radio,
  Clock,
  ShieldCheck,
  Navigation,
  ShieldAlert,
  MessageCircleQuestion,
  UserCheck,
  LifeBuoy,
  Info,
} from 'lucide-react';
import {
  EmergencyProtocol,
  MossQueryResult,
  DispatchIntent,
  OverrideRecord,
} from '../types';
import { speakableCategories, type CategoryMatch } from '../engine/guidanceCategories';
import type { RouteVerdict } from '../engine/routing';
import { CLARIFY_QUESTIONS, nextQuestion, type ClarifyState } from '../engine/clarify';
import { CopilotCoachPanel } from './CopilotCoachPanel';
import { EkgMonitor } from './EkgMonitor';
import { EMERGENCY_PROTOCOLS } from '../engine/emergencyProtocols';
import { cn } from '@/lib/utils';
import type { MicState } from './CallerPanel';
import {
  matchedProtocol,
  abstainMessage,
  confidenceOf,
  UNIVERSAL_PREARRIVAL_STEPS,
  UNIVERSAL_SAFETY_FLOOR,
} from '../engine/triageGate';

interface DispatcherHUDProps {
  queryResult: MossQueryResult | null;
  dispatchIntent: DispatchIntent | null;
  guidance: CategoryMatch[];
  /** What the engine received: voice or keyboard. */
  transcriptSource: 'mic' | 'typed' | null;
  /** Mirrors the microphone lifecycle so the mic is visible when this panel is scrolled. */
  micState: MicState;
  /** Real Moss availability, so the console never implies it is working. */
  mossStatus: { ready: boolean; serving: boolean; reason: string | null } | null;
  /** Speech heard while a question was open but not understood. */
  clarifyHeard: string | null;
  route: RouteVerdict | null;
  clarify: ClarifyState | null;
  onClarifyAnswer: (questionId: string, optionLabel: string) => void;
  onStopClarify: () => void;
  overrideLog: OverrideRecord[];
  onOverride: (protocol: EmergencyProtocol) => void;
  onTriggerMetronome: (active: boolean) => void;
  isMetronomeActive: boolean;
  transcript: string;
  requestId: number;
}

export const DispatcherHUD: React.FC<DispatcherHUDProps> = ({
  queryResult,
  dispatchIntent,
  guidance,
  transcriptSource,
  micState,
  mossStatus,
  clarifyHeard,
  route,
  clarify,
  onClarifyAnswer,
  onStopClarify,
  overrideLog,
  onOverride,
  onTriggerMetronome,
  isMetronomeActive,
  transcript,
  requestId,
}) => {
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  /** Manual override: a human dispatcher may select a protocol we refused. */
  const [overrideProtocol, setOverrideProtocol] = useState<EmergencyProtocol | null>(null);

  /**
   * Selecting an override both displays the protocol and records the decision.
   * Recording lives in the parent so it survives this panel remounting and
   * appears in the audit trail immediately.
   */
  const applyOverride = (p: EmergencyProtocol) => {
    setOverrideProtocol(p);
    onOverride(p);
  };

  const abstained = queryResult?.outcome?.kind === 'abstain';
  const protocol = overrideProtocol ?? (queryResult ? matchedProtocol(queryResult.outcome) : null);
  const confidence = confidenceOf(queryResult?.outcome);

  // A new query invalidates any previous manual override.
  useEffect(() => {
    setOverrideProtocol(null);
  }, [queryResult]);

  const toggleStep = (idx: number) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const verifiedCount = Object.values(checkedSteps).filter(Boolean).length;
  const totalActions = protocol?.immediateActions.length || 0;
  const progressPct = totalActions > 0 ? (verifiedCount / totalActions) * 100 : 0;

  return (
    <div className="clean-card flex flex-col min-h-[520px] sm:min-h-[640px] overflow-hidden">
      {/* HUD Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs shrink-0">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900">Dispatcher Clinical HUD</h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Sub-10ms Retrieval
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">Automated protocol matching & unit dispatch</p>
          </div>
        </div>

        {/* Moss Latency Pill */}
        {queryResult && (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'border px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold shadow-2xs font-mono',
                abstained
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              )}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>
                {abstained
                  ? 'ABSTAINED'
                  : `Moss: ${queryResult.latencyMs.toFixed(2)} ms · conf ${(confidence * 100).toFixed(0)}%`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5">
        <>
          {/*
            Operator-facing provenance and mic state.

            Hoisted above the matched/abstain/standby branch for the same
            reason the override trail is: an indicator that vanishes in the state
            you most need it is worse than no indicator. The mic can be live
            while this panel is scrolled, and the operator must always know
            whether the engine got speech or keystrokes.
          */}
          <div className="flex flex-wrap items-center gap-2">
            {transcriptSource && (
              <span
                className={cn(
                  'text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                  transcriptSource === 'mic'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                )}
              >
                {transcriptSource === 'mic' ? 'From microphone' : 'Typed'}
              </span>
            )}
            {mossStatus && !mossStatus.serving && (
              <span
                className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-300 bg-amber-50 text-amber-800"
                title={mossStatus.reason ?? 'Moss runtime is not serving queries'}
              >
                Moss unavailable &mdash; local triage only
              </span>
            )}
            {(micState === 'listening' || micState === 'starting') && (
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-rose-300 bg-rose-50 text-rose-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                {micState === 'starting' ? 'Mic starting' : 'Mic live'}
              </span>
            )}
          </div>

          {/* Dispatcher-confirmed provenance. Hoisted ABOVE the matched/abstain
              branch on purpose: while this lived inside the abstain card it
              disappeared the instant the answers resolved a protocol — exactly
              when the dispatcher most needs to see why. */}
          {clarify?.resolvedProtocolId && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800">
                Protocol confirmed by your answers
              </span>
              <ul className="space-y-0.5">
                {clarify.answers.map((a) => (
                  <li key={a.questionId} className="text-[10px] font-mono text-emerald-900/80">
                    {a.question} &rarr; <span className="font-bold">{a.optionLabel}</span>
                    {!a.contributed && (
                      <span className="text-emerald-700/60"> (not used for matching)</span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-[10px] font-mono text-emerald-700/80 pt-1">
                Confirmed by a dispatcher, not inferred. The answers are the record.
              </p>
            </div>
          )}

          {!protocol && !abstained ? (
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
                  Select an emergency scenario or speak into the microphone to see sub-10ms in-browser protocol matching against a real call.
                </p>
              </div>
            </motion.div>
          ) : protocol ? (
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

              {/* Dynamic Animated EKG Biometric Oscilloscope */}
              <EkgMonitor
                category={protocol.category}
                cadenceBpm={protocol.cadenceBpm}
                isMetronomeActive={isMetronomeActive}
              />

              {/* Immediate Action Checklist with Animated Progress */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Life-Saving Clinical Actions:</span>
                  </h4>
                  <span className="text-[11px] font-mono text-slate-600 font-bold bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {verifiedCount} / {totalActions} Verified ({Math.round(progressPct)}%)
                  </span>
                </div>

                {/* Animated Spring Progress Bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-emerald-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  />
                </div>

                <div className="space-y-2">
                  {protocol.immediateActions.map((action, idx) => {
                    const isChecked = !!checkedSteps[idx];
                    return (
                      <motion.div
                        key={idx}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => toggleStep(idx)}
                        className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 transition-all cursor-pointer select-none ${
                          isChecked
                            ? 'border-emerald-300 bg-emerald-50/80 text-emerald-950 line-through opacity-85 shadow-2xs'
                            : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/60 text-slate-800 shadow-2xs'
                        }`}
                      >
                        <motion.div
                          initial={false}
                          animate={isChecked ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                          transition={{ duration: 0.2 }}
                          className="mt-0.5 shrink-0"
                        >
                          {isChecked ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-300 bg-white" />
                          )}
                        </motion.div>
                        <span className="leading-relaxed flex-1 font-medium">{action}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Why this protocol: the phrases that actually matched.
                  The engine has misrouted before, so a dispatcher should be able
                  to sanity-check the decision against the caller's own words
                  rather than take it on trust. */}
              {protocol && queryResult && queryResult.outcome.anchors.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                    Matched on {queryResult.outcome.anchors.length} finding
                    {queryResult.outcome.anchors.length === 1 ? '' : 's'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {queryResult.outcome.anchors.map((a) => (
                      <span
                        key={a}
                        className="px-2 py-0.5 rounded-md bg-white border border-slate-300 text-[10px] font-mono font-bold text-slate-700"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] font-mono text-slate-500">
                    Confidence {(queryResult.outcome.confidence * 100).toFixed(0)}%. If these do not
                    match what the caller said, override it below.
                  </p>
                </div>
              )}

              {/* Dispatch intent — what triage asks CAD for, and nothing more. */}
              {dispatchIntent && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block leading-tight">
                          Dispatch intent &mdash; not yet dispatched
                        </span>
                        <span className="text-[10px] text-amber-700 font-mono">
                          {dispatchIntent.protocolCode} &middot; {dispatchIntent.protocolId}
                        </span>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300 shrink-0">
                      {dispatchIntent.status.replace('_', ' ')}
                    </span>
                  </div>

                  <dl className="bg-white p-3 rounded-xl border border-amber-200/70 space-y-2 text-[11px]">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-500 font-mono">Recommended unit</dt>
                      <dd className="font-bold text-slate-900 text-right">{dispatchIntent.unitType}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-500 font-mono">Priority</dt>
                      <dd className="font-bold text-slate-900 text-right">{dispatchIntent.priority}</dd>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <dt className="text-slate-500 font-mono shrink-0">Required equipment</dt>
                      <dd className="font-bold text-slate-800 text-right truncate max-w-[190px] sm:max-w-[280px]">
                        {dispatchIntent.requiredEquipment.join(', ')}
                      </dd>
                    </div>
                  </dl>

                  <p className="text-[10px] font-mono text-amber-900/80 leading-relaxed">
                    No unit is assigned and no ETA exists: there is no CAD backend behind this console.
                    Everything above is copied from the matched protocol, not from a dispatch system.
                  </p>
                </motion.div>
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
          ) : route?.kind === 'informational' ? (
            /* ── INFORMATIONAL: a general health question, not an emergency. ──
               Showing the amber "call 911 now, start compressions" card here was
               both wrong and alarming, and it trained people to distrust the one
               screen where that warning actually matters. We decline to give
               medical advice — and we say so usefully, with a way out. */
            <motion.div
              key="informational"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="bg-sky-50 border-2 border-sky-300 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <Info className="w-5 h-5 text-sky-600 shrink-0" />
                  <h3 className="text-sm font-bold text-sky-900 uppercase tracking-wide">
                    General health question &mdash; not treated as an emergency
                  </h3>
                </div>

                <p className="text-xs text-sky-950 leading-relaxed font-sans">
                  This reads like a question about health in general rather than something
                  happening right now, so it has not been run as a live emergency.
                </p>

                <div className="bg-white border border-sky-200 rounded-xl p-3.5 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-800">
                    We do not give medical advice here
                  </span>
                  <p className="text-xs text-sky-950 leading-relaxed font-sans">
                    Medication doses, interactions and symptom interpretation need someone who
                    can see the person and their history. Please speak to {route.signpost}.
                  </p>
                </div>

                <div className="bg-white border border-amber-300 rounded-xl p-3.5 space-y-1.5">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800">
                    If this is happening now
                  </span>
                  <p className="text-xs text-amber-950 leading-relaxed font-sans">
                    If someone is in trouble right now &mdash; not breathing, unresponsive,
                    bleeding heavily, or having a seizure &mdash; call 911 or your local
                    emergency number immediately, and say what you are seeing.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ── ABSTAIN: we refused to guess. Say so, and do something useful. ── */
            <motion.div
              key="abstain"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                  <h2 className="text-base font-black text-amber-950 leading-tight">
                    Triage abstained — no protocol selected
                  </h2>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                  {queryResult && queryResult.outcome.kind === 'abstain'
                    ? abstainMessage(queryResult.outcome)
                    : ''}{' '}
                  No clinical protocol was selected, no instructions were spoken, and no unit was
                  dispatched.
                </p>
                <p className="text-[11px] text-amber-800/80 font-mono">
                  REASON:{' '}
                  {queryResult?.outcome.kind === 'abstain' ? queryResult.outcome.reason : 'unknown'}
                </p>
              </div>

              {/* The clarifying loop, replacing a static list of five questions:
                  one at a time, answered by tap, re-triaging after each, and
                  stopping the moment the answers resolve a protocol. */}
              {clarify && !clarify.stoppedByDispatcher && !clarify.resolvedProtocolId && (
                <div className="bg-white border-2 border-amber-300 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <MessageCircleQuestion className="w-4 h-4 text-amber-600" />
                      <span>
                        {nextQuestion(clarify)
                          ? `Ask the caller — question ${clarify.answers.length + 1} of ${CLARIFY_QUESTIONS.length}`
                          : 'No more clarifying questions'}
                      </span>
                    </h4>
                    <button
                      type="button"
                      onClick={onStopClarify}
                      className="text-[10px] font-mono text-slate-500 hover:text-slate-800 underline shrink-0"
                    >
                      stop asking
                    </button>
                  </div>

                  {(() => {
                    const q = nextQuestion(clarify);
                    if (!q) {
                      return (
                        <p className="text-xs text-slate-600 font-sans">
                          All questions answered and still no confident match. The guidance above
                          and the dispatcher override below are the remaining options.
                        </p>
                      );
                    }
                    return (
                      <>
                        <p
                          data-testid="clarify-question"
                          className="text-sm text-slate-900 font-sans font-semibold leading-snug"
                        >
                          {q.text}
                        </p>
                        <p className="text-[10px] font-mono text-slate-500">{q.rationale}</p>
                        {clarifyHeard && (
                          <p
                            data-testid="clarify-unheard"
                            className="text-[11px] font-mono text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5"
                          >
                            Heard &ldquo;{clarifyHeard}&rdquo; &mdash; not an answer I can use. Tap an
                            option, or repeat more clearly.
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {q.options.map((o) => (
                            <button
                              key={o.label}
                              type="button"
                              onClick={() => onClarifyAnswer(q.id, o.label)}
                              className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-[11px] font-mono font-bold text-amber-900 cursor-pointer touch-manipulation"
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                      </>
                    );
                  })()}

                  {clarify.answers.length > 0 && (
                    <div className="pt-2 mt-1 border-t border-slate-200 space-y-1">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                        Answered
                      </span>
                      <ul className="space-y-0.5">
                        {clarify.answers.map((a) => (
                          <li key={a.questionId} className="text-[10px] font-mono text-slate-600">
                            {a.question} &rarr;{' '}
                            <span className="font-bold text-slate-800">{a.optionLabel}</span>
                            {!a.contributed && (
                              <span className="text-slate-400"> (not used for matching)</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {clarify?.stoppedByDispatcher && (
                <p className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 rounded-xl p-2.5">
                  Clarifying stopped by dispatcher. The abstention still stands — use the guidance
                  above or the override below.
                </p>
              )}

              {/* Broad, low-risk guidance. This is what makes an abstention a
                  real answer rather than a refusal: we cannot name the condition,
                  but for most presentations the right first action does not depend
                  on the name. */}
              {guidance.length > 0 && (
                <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-sky-900 flex items-center gap-1.5">
                    <LifeBuoy className="w-4 h-4 text-sky-600" />
                    <span>Do this now &mdash; {guidance[0].category.label}</span>
                  </h4>

                  <ul className="space-y-1.5 text-xs text-sky-950 list-disc list-inside font-sans leading-relaxed">
                    {guidance[0].category.safeActions.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>

                  <div className="pt-2 border-t border-sky-200 space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-700">
                      Call 911 now if:
                    </span>
                    <ul className="space-y-1 text-[11px] text-rose-900 list-disc list-inside">
                      {guidance[0].category.redFlags.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-sky-200 space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-700">
                      Do not:
                    </span>
                    <ul className="space-y-1 text-[11px] text-amber-900 list-disc list-inside">
                      {guidance[0].category.doNot.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>

                  {guidance.length > 1 && (
                    <p className="text-[10px] font-mono text-sky-800/80 pt-1">
                      Also possible: {guidance.slice(1).map((g) => g.category.label).join(' · ')}
                    </p>
                  )}

                  <p className="text-[10px] font-mono text-sky-900/70 pt-1">
                    General first aid for this kind of emergency &mdash; not a diagnosis.
                    Confidence {(guidance[0].confidence * 100).toFixed(0)}%
                    {speakableCategories(guidance).length === 0 && ', shown on screen only'}
                  </p>
                </div>
              )}

              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Safe to do right now:</span>
                </h4>
                <ul className="space-y-1 text-xs text-emerald-950 list-disc list-inside font-sans">
                  {UNIVERSAL_PREARRIVAL_STEPS.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
                <div className="pt-2 mt-1 border-t border-emerald-200 text-xs text-emerald-950 font-semibold leading-relaxed">
                  {UNIVERSAL_SAFETY_FLOOR}
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-slate-500" />
                  <span>Dispatcher override — triage is refusing, you are not</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {EMERGENCY_PROTOCOLS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyOverride(p)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-[11px] font-mono font-bold text-slate-700 cursor-pointer touch-manipulation"
                    >
                      {p.id}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] font-mono text-slate-500">
                  When a human overrides an abstain, the human owns the call. Every override is
                  recorded below.
                </p>

              </div>
            </motion.div>
          )}

      {/* Override audit trail.
          Rendered OUTSIDE the matched/abstain branch on purpose: while this lived
          inside the abstain card it disappeared the instant a dispatcher used it,
          which is exactly when an operator most needs to see what has already been
          overridden. */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Override log ({overrideLog.length})
            </span>
            {overrideLog.length > 0 && (
              <span className="text-[10px] font-mono text-slate-400">newest first</span>
            )}
          </div>

          {overrideLog.length === 0 ? (
            <p className="text-[10px] font-mono text-slate-400">
              No overrides recorded this session.
            </p>
          ) : (
            <ul className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {overrideLog.map((r) => (
                <li
          key={r.id}
          className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 space-y-0.5"
                >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono font-bold text-slate-900">
              {r.presentedReason} &rarr; {r.chosenProtocolId}
            </span>
            <span className="text-[9px] font-mono text-slate-400 shrink-0">
              {new Date(r.atIso).toLocaleTimeString()}
            </span>
          </div>
          <div className="text-[9px] font-mono text-slate-500 truncate">
            {r.chosenProtocolTitle}
          </div>
          <div className="text-[9px] font-mono text-slate-400 truncate">
            refuted conf {r.presentedConfidence.toFixed(2)} &middot; {r.operator}
          </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        </>
      </div>
    </div>
  );
};
