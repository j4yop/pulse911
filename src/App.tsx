import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { Navbar } from './components/Navbar';
import { TopLoader } from './components/TopLoader';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { ViewSkeleton } from './components/Deferred';
import {
  EmergencyProtocol,
  EmergencyScenario,
  MossQueryResult,
  DispatchIntent,
  OverrideRecord,
} from './types';
import { EMERGENCY_SCENARIOS, EMERGENCY_PROTOCOLS } from './engine/emergencyProtocols';
import { mossEngine } from './engine/mossEngine';
import type { MicState } from './components/CallerPanel';
import { routeTranscript, type RouteVerdict } from './engine/routing';
import { matchSpokenAnswer } from './engine/clarifyVoice';
import {
  advanceClarify,
  emptyClarifyState,
  nextQuestion,
  stopClarify,
  type ClarifyState,
  matchingTranscript,
} from './engine/clarify';
import type { CategoryMatch } from './engine/guidanceCategories';
import { audioService } from './engine/speechSimulation';
import {
  createOverrideRecord,
  guidanceFor,
  matchedProtocol,
  speakableGuidanceScript,
} from './engine/triageGate';
import { cn } from '@/lib/utils';

// ── Route-level code splitting ──────────────────────────────────────────────
// Every tab is its own chunk. The landing page no longer downloads the console,
// benchmark, architecture or PRD code (or the Moss/ONNX runtime) up front.
const LandingView = lazy(() =>
  import('./components/LandingView').then((m) => ({ default: m.LandingView }))
);
const ConsoleView = lazy(() =>
  import('./components/ConsoleView').then((m) => ({ default: m.ConsoleView }))
);
const LatencyBenchmark = lazy(() =>
  import('./components/LatencyBenchmark').then((m) => ({ default: m.LatencyBenchmark }))
);
const ArchitectureView = lazy(() =>
  import('./components/ArchitectureView').then((m) => ({ default: m.ArchitectureView }))
);
const PRDView = lazy(() => import('./components/PRDView').then((m) => ({ default: m.PRDView })));

const TAB_IDS = ['overview', 'console', 'benchmark', 'architecture', 'prd'] as const;
type TabId = (typeof TAB_IDS)[number];

// NOTE: there is deliberately NO pre-seeded protocol and NO pre-dispatched unit.
// Previously `INITIAL_QUERY_RESULT` hardcoded cardiac arrest at score 1.0 and
// `INITIAL_DISPATCHED_UNIT` showed MEDIC-14 as already dispatched, so the console
// displayed a confident cardiac protocol before a single word was spoken. The
// console now opens in true CAD Standby and only ever shows a protocol that the
// triage engine actually matched.

export const App: React.FC = () => {
  const initialTab = TAB_IDS.find((t) => t === new URLSearchParams(window.location.search).get('tab'));
  const [activeTab, setActiveTab] = useState<TabId>(initialTab ?? 'overview');

  // Deep-linkable tabs (?tab=console) — shareable demo URLs and history sync.
  useEffect(() => {
    const handlePopState = () => {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      const matchedTab = TAB_IDS.find((t) => t === tabParam);
      if (matchedTab && matchedTab !== activeTab) {
        setActiveTab(matchedTab);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

  const handleSelectTab = (tab: TabId) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (url.searchParams.get('tab') !== tab) {
      url.searchParams.set('tab', tab);
      window.history.pushState(null, '', url);
    }
    // Return to the top when switching tabs so the user is not dropped into the
    // middle of a long (lazy-loaded) view on mobile.
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  // Start in true standby: no scenario, no transcript, no protocol, no unit.
  const [activeScenario, setActiveScenario] = useState<EmergencyScenario | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [queryResult, setQueryResult] = useState<MossQueryResult | null>(null);
  const [dispatchIntent, setDispatchIntent] = useState<DispatchIntent | null>(null);
  /**
   * Broad, low-risk guidance for the current transcript, shown on the abstain
   * path. Computed here (not in the HUD) so it is derived from the same text
   * the engine decided on, and so speech and screen can never disagree.
   */
  const [guidance, setGuidance] = useState<CategoryMatch[]>([]);
  /** Whether the engine received speech or typed text. Shown on the result. */
  const [transcriptSource, setTranscriptSource] = useState<'mic' | 'typed' | null>(null);
  /** Mirrors the microphone lifecycle so the dock can show it while scrolled away. */
  const [micState, setMicState] = useState<MicState>('idle');
  /** Polled so the console can state Moss's real availability. */
  const [mossStatus, setMossStatus] = useState(mossEngine.getMossStatus());
  /** Set when speech arrived while a question was pending but did not match. */
  const [clarifyHeard, setClarifyHeard] = useState<string | null>(null);
  /**
   * Emergency vs general-question routing. Evaluated from the same text the
   * engine decided on, so the two can never disagree about what was said.
   */
  const [route, setRoute] = useState<RouteVerdict | null>(null);
  /**
   * The clarifying session for the current call. Started on every query and
   * advanced by the dispatcher answering one question at a time. Purely
   * additive to the caller's own words, and it can still end in abstention.
   */
  const [clarify, setClarify] = useState<ClarifyState | null>(null);
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState(true);
  /**
   * Append-only audit trail of human overrides of a triage abstention.
   *
   * Deliberately NOT cleared when a new call arrives — a log that resets on
   * every call is not a log. Only `handleClearCall` and the explicit clear
   * button remove entries, so an operator can see what has already been
   * overridden during a shift.
   */
  const [overrideLog, setOverrideLog] = useState<OverrideRecord[]>([]);
  /** Measured latency of the last query. Null until a real query has run. */
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  /** Increments per processed call — keys/cancels async AI enrichment per scenario. */
  const [callRequestId, setCallRequestId] = useState(0);
  /**
   * Monotonic token for the current call, bumped synchronously at the top of
   * `handleProcessTranscript`. Background Moss corroboration compares against
   * this before writing, so a slow refinement from a previous call can never
   * land on top of a newer one.
   */
  const callTokenRef = useRef(0);


  /**
   * Everything that happens once a protocol is decided: the scenario card, the
   * dispatch intent, the spoken instruction and the CPR pacer.
   *
   * Extracted so the clarifying loop can reach the same presentation. The safety
   * gate is still `matchedProtocol()` upstream — this function is only ever
   * handed a protocol that already passed it, and it never decides anything.
   */
  const presentMatch = useCallback(
    (
      protocol: EmergencyProtocol,
      text: string,
      scenario?: EmergencyScenario,
      speakAudio = true
    ) => {
          setActiveScenario(
          scenario ?? {
            id: 'scen_live_call',
            title: 'Live Inbound 911 Call (Real-Time Ingest)',
            tagline: 'Live voice audio / freeform speech, triaged in-browser',
            iconName: 'PhoneCall',
            callerProfile: 'Live Caller (Direct Audio Stream)',
            callerSpeechTranscript: text,
            // No location, no vitals. Nothing in this app supplies either, so
            // the honest values are absent rather than invented. The previous
            // version hardcoded "Triangulating Cell Tower GPS", "Metro Dispatch
            // Sector 4" and San Francisco coordinates and rendered them under a
            // map-pin icon; `reportedVitals` claimed a monitor was attached when
            // none is. See EmergencyScenario.callerLocation.
            triagePriority: (protocol.triageLevel.includes('1')
              ? 'ESI-1 (Immediate Resuscitation)'
              : 'ESI-2 (Emergent)') as any,
          }
        );

        // Record what triage is ASKING CAD for — never invent the response.
        //
        // This used to fabricate a whole ambulance: id MEDIC-14, the name
        // "Medic Engine 14 (ALS Paramedic Rescue)", "Station 4 • Downtown
        // Core", a named crew, and `Math.random()` for the ETA — all rendered
        // under a "DISPATCHED" badge with a moving progress bar and "GPS
        // Telemetry Stream Active". None of it came from a system. There is
        // no CAD backend, so there is nothing truthful to say beyond what the
        // protocol itself recommends.
        setDispatchIntent({
          protocolId: protocol.id,
          protocolCode: protocol.code,
          unitType: protocol.unitRecommendation.unitType,
          priority: protocol.unitRecommendation.priority,
          requiredEquipment: protocol.unitRecommendation.requiredEquipment,
          status: 'AWAITING_CAD',
        });

        if (speakAudio && audioFeedbackEnabled) {
          audioService.speakVerbalInstruction(protocol.verbalResponseText);
        }


        setDispatchIntent({
          protocolId: protocol.id,
          protocolCode: protocol.code,
          unitType: protocol.unitRecommendation.unitType,
          priority: protocol.unitRecommendation.priority,
          requiredEquipment: protocol.unitRecommendation.requiredEquipment,
          status: 'AWAITING_CAD',
        });

        if (speakAudio && audioFeedbackEnabled) {
          audioService.speakVerbalInstruction(protocol.verbalResponseText);
        }

        if (protocol.cadenceBpm && isMetronomeActive) {
          audioService.startCprMetronome(protocol.cadenceBpm);
        }
      },
    [audioFeedbackEnabled, isMetronomeActive]
  );

  const handleProcessTranscript = useCallback(
    async (
      text: string,
      scenario?: EmergencyScenario,
      source: 'mic' | 'typed' = 'typed',
      speakAudio = true
    ) => {
      setIsProcessing(true);
      setCurrentTranscript(text);
      setCallRequestId((n) => n + 1);
      const callToken = ++callTokenRef.current;
      setTranscriptSource(source);
      audioService.playRadioChirp();

      try {
        // Query Moss in-memory semantic retrieval engine
        const res = await mossEngine.query(text);
        setQueryResult(res);
        setLatencyMs(res.latencyMs);
        // Computed for matched and abstained alike: on a match the protocol
        // governs, and this quietly backs it up.
        setGuidance(guidanceFor(text));
        setMossStatus(mossEngine.getMossStatus());
        const r = routeTranscript(text);
        setRoute(r);
        setClarify(emptyClarifyState(text));

        // SAFETY GATE — the single point deciding what may be spoken or sent.
        const protocol = matchedProtocol(res.outcome);

        if (protocol) {
          presentMatch(protocol, text, scenario, speakAudio);
        } else {
          // ABSTAIN: no protocol, no unit, no CPR pacer. Do not guess, do not
          // speak a clinical protocol, do not dispatch. What IS spoken is the
          // zero-risk safety floor plus, when clearly matched, broad low-risk
          // category guidance — abstaining on the diagnosis is not abstaining
          // on helping. `guidance` is intentionally left in place here; it was
          // the whole point of setting it.
          setActiveScenario(scenario ?? null);
          setDispatchIntent(null);
          setIsMetronomeActive(false);
          audioService.stopCprMetronome();

          // Never speak an emergency script at a general health question.
          // Telling someone who asked about their blood pressure to "start
          // chest compressions" is alarming, wrong, and trains people to
          // distrust the one screen where the warning matters.
          if (speakAudio && audioFeedbackEnabled && r.kind === 'emergency') {
            // Never a dead end: the zero-risk safety floor, plus at most one
            // clearly-matched broad category's first action and red flag.
            for (const line of speakableGuidanceScript(text)) {
              audioService.speakVerbalInstruction(line);
            }
          }
        }

        // ── Moss corroboration (background, non-gating) ───────────────────
        // The decision above is already final: spoken and dispatched. This can
        // only make the SAME decision better attested — it can never re-decide.
        //
        // Deliberately refused, because each would contradict what the
        // dispatcher has already heard and acted on:
        //   • a different protocol  → we already spoke and dispatched ours
        //   • an abstain            → we already spoke the safety floor
        // A local abstain is therefore left alone too: Moss may not resurrect a
        // protocol after the caller was told we could not identify the
        // emergency. Surfacing that disagreement is future work, not a swap.
        if (protocol) {
          void mossEngine
            .refineWithMoss(text)
            .then((refined) => {
              if (callToken !== callTokenRef.current) return; // superseded
              if (!refined) return; // runtime not warm — keep the local result
              const refinedProtocol = matchedProtocol(refined.outcome);
              if (!refinedProtocol || refinedProtocol.id !== protocol.id) return;
              setQueryResult({
                ...refined,
                // State the real provenance: the local matcher decided, Moss
                // agreed. Labelling this plain "Moss WASM" would imply the
                // safety decision came from the semantic engine.
                engine: 'Moss WASM Runtime — corroborated local triage',
              });
              setLatencyMs(refined.latencyMs);
            })
            .catch(() => {
              /* Enrichment only. A failed corroboration is never a triage error. */
            });
        }
      } catch (err) {
        console.error('[Pulse911] Error processing transcript:', err);
      } finally {
        setIsProcessing(false);
      }
    },
    [audioFeedbackEnabled, isMetronomeActive]
  );

  const handleToggleMetronome = (active: boolean) => {
    // The metronome is a CPR pacer, so it is only ever available for a
    // MATCHED protocol. On abstain it can never be started.
    const protocol = matchedProtocol(queryResult?.outcome);
    if (active && protocol?.cadenceBpm) {
      setIsMetronomeActive(true);
      audioService.startCprMetronome(protocol.cadenceBpm);
    } else {
      setIsMetronomeActive(false);
      audioService.stopCprMetronome();
    }
  };

  const handleToggleAudioFeedback = useCallback(() => {
    setAudioFeedbackEnabled((prev) => !prev);
  }, []);

  /**
   * A human overriding a triage abstention is the safety valve that makes
   * abstention usable — and the single most important thing to audit later.
   * So the override is recorded the moment it happens, with what triage
   * refused and why.
   *
   * The operator is an explicit placeholder, not a pretend name: this build has
   * no authentication, so claiming a dispatcher identity would be the same
   * fabrication we removed from the dispatch card.
   */
  const handleOverride = useCallback(
    (protocol: EmergencyProtocol) => {
      const record = createOverrideRecord({
        outcome: queryResult?.outcome,
        transcript: currentTranscript,
        chosen: protocol,
        seq: overrideLog.length,
      });
      if (record) setOverrideLog((prev) => [record, ...prev]);
    },
    [queryResult, currentTranscript, overrideLog.length]
  );


  /**
   * Record one answer and re-triage.
   *
   * The dispatcher asks; the loop never invents an answer. On a resolve we go
   * through exactly the same presentation as a first-pass match, so a
   * dispatcher-confirmed protocol is indistinguishable from an engine-matched
   * one downstream — no second, weaker path into speech or dispatch.
   */
  const handleClarifyAnswer = useCallback(
    (questionId: string, optionLabel: string) => {
      if (!clarify) return;
      const result = advanceClarify(clarify, questionId, optionLabel, EMERGENCY_PROTOCOLS);
      setClarify(result.state);

      if (result.outcome.kind === 'matched') {
        const confirmed: MossQueryResult = {
          outcome: result.outcome,
          score: result.outcome.confidence,
          latencyMs: 0,
          engine: 'Clarifying questions (dispatcher-confirmed)',
          vectorDistance: +(1 - result.outcome.confidence).toFixed(3),
          tokensEvaluated: result.state.answers.length,
        };
        setQueryResult(confirmed);
        setGuidance([]);
        presentMatch(result.outcome.protocol, clarify.transcript, undefined, true);
      } else {
        // Still unresolved: refresh the safety-floor guidance for the fuller
        // picture the answers now give us.
        setGuidance(guidanceFor(matchingTranscript(result.state)));
      }
    },
    [clarify, presentMatch]
  );

  /**
   * Interpret speech as an answer to the pending clarifying question.
   *
   * Returns true when it consumed the utterance, so the caller knows not to
   * also treat it as an emergency description. A mismatch returns false and
   * surfaces what was heard — refusing is the safe default, because a misheard
   * clinical answer selects the wrong protocol for a real person.
   */
  const handleSpokenAnswer = useCallback(
    (spoken: string): boolean => {
      const pending = clarify && !clarify.resolvedProtocolId && !clarify.stoppedByDispatcher
        ? nextQuestion(clarify)
        : null;
      if (!pending) return false;

      const option = matchSpokenAnswer(spoken, pending);
      if (!option) {
        // Not understood. Say so and leave the buttons up — never guess.
        setClarifyHeard(spoken);
        return true;
      }
      setClarifyHeard(null);
      const r = handleClarifyAnswer(pending.id, option.label);
      return true;
    },
    [clarify, handleClarifyAnswer]
  );

  const handleStopClarify = useCallback(() => {
    setClarify((prev) => (prev ? stopClarify(prev) : prev));
  }, []);

  const handleClearCall = useCallback(() => {
    audioService.stopSpeaking();
    audioService.stopCprMetronome();
    setIsMetronomeActive(false);
    setActiveScenario(null);
    setCurrentTranscript('');
    setQueryResult(null);
    setDispatchIntent(null);
    setGuidance([]);
    setTranscriptSource(null);
    setRoute(null);
    setClarify(null);
    setClarifyHeard(null);
  }, []);

  return (
    <AuroraBackground
      showRadialGradient={activeTab !== 'console'}
      intensity={activeTab === 'console' ? 'vibrant' : 'subtle'}
      className="min-h-dvh pb-28 text-slate-900 clinical-grid selection:bg-rose-500/20 selection:text-rose-600 overflow-x-clip"
    >
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        latencyMs={latencyMs}
        engineLabel={queryResult?.engine ?? null}
        isCallActive={activeScenario !== null}
        audioFeedbackEnabled={audioFeedbackEnabled}
        onToggleAudioFeedback={handleToggleAudioFeedback}
      />

      {/* Global Ingestion / Top Loading Progress Indicator */}
      <TopLoader isLoading={isProcessing} activeTab={activeTab} />

      {/* Main Workspace */}
      <main
        className={cn(
          'flex-1 w-full mx-auto pb-8 sm:pb-12',
          activeTab === 'overview'
            ? 'max-w-7xl px-4 sm:px-6 lg:px-8 pt-0'
            : 'max-w-[1750px] p-3 sm:p-6 space-y-4 sm:space-y-6'
        )}
      >
        <ErrorBoundary fallbackTitle="Application View Recovered">
          <Suspense fallback={<ViewSkeleton label="Loading view" />}>
            {activeTab === 'overview' && (
              <div key="overview" className="animate-appear">
                <LandingView
                  onLaunchConsole={(scen) => {
                    if (scen) {
                      handleProcessTranscript(scen.callerSpeechTranscript, scen, 'typed', true);
                    }
                    handleSelectTab('console');
                  }}
                  onNavigateTab={(tab) => handleSelectTab(tab)}
                  latencyMs={latencyMs}
                />
              </div>
            )}

            {activeTab === 'console' && (
              <ConsoleView
                activeScenario={activeScenario}
                currentTranscript={currentTranscript}
                isProcessing={isProcessing}
                queryResult={queryResult}
                dispatchIntent={dispatchIntent}
                guidance={guidance}
                transcriptSource={transcriptSource}
                micState={micState}
                mossStatus={mossStatus}
                onMicStateChange={setMicState}
                onSpokenAnswer={handleSpokenAnswer}
                awaitingAnswerFor={clarify && !clarify.resolvedProtocolId ? (nextQuestion(clarify)?.text ?? null) : null}
                clarifyHeard={clarifyHeard}
                route={route}
                clarify={clarify}
                onClarifyAnswer={handleClarifyAnswer}
                onStopClarify={handleStopClarify}
                overrideLog={overrideLog}
                onOverride={handleOverride}
                isMetronomeActive={isMetronomeActive}
                audioFeedbackEnabled={audioFeedbackEnabled}
                latencyMs={latencyMs}
                callRequestId={callRequestId}
                onProcessTranscript={(txt, scen, src) => handleProcessTranscript(txt, scen, src)}
                onToggleMetronome={handleToggleMetronome}
                onToggleAudioFeedback={handleToggleAudioFeedback}
                onClearCall={handleClearCall}
              />
            )}

            {activeTab === 'benchmark' && (
              <div key="benchmark" className="animate-appear">
                <LatencyBenchmark />
              </div>
            )}

            {activeTab === 'architecture' && (
              <div key="architecture" className="animate-appear">
                <ArchitectureView />
              </div>
            )}

            {activeTab === 'prd' && (
              <div key="prd" className="animate-appear">
                <PRDView />
              </div>
            )}
          </Suspense>
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/90 bg-white/90 backdrop-blur-md py-4 px-6 text-xs text-slate-500 flex items-center justify-center shadow-2xs">
        <div className="font-mono text-[11px] text-slate-400 text-center">
          Built for YC Fall 2026 &times; Moss Zero Latency Builder Sprint
        </div>
      </footer>
    </AuroraBackground>
  );
};

export default App;