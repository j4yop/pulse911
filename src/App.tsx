import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Navbar } from './components/Navbar';
import { TopLoader } from './components/TopLoader';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { ViewSkeleton } from './components/Deferred';
import { EmergencyScenario, MossQueryResult, DispatchedUnit } from './types';
import { EMERGENCY_SCENARIOS, EMERGENCY_PROTOCOLS } from './engine/emergencyProtocols';
import { mossEngine } from './engine/mossEngine';
import { audioService } from './engine/speechSimulation';
import { canDispatch, matchedProtocol, UNIVERSAL_SAFETY_FLOOR } from './engine/triageGate';
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
  const [dispatchedUnit, setDispatchedUnit] = useState<DispatchedUnit | null>(null);
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState(true);
  /** Measured latency of the last query. Null until a real query has run. */
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  /** Increments per processed call — keys/cancels async AI enrichment per scenario. */
  const [callRequestId, setCallRequestId] = useState(0);

  const handleProcessTranscript = useCallback(
    async (text: string, scenario?: EmergencyScenario, speakAudio = true) => {
      setIsProcessing(true);
      setCurrentTranscript(text);
      setCallRequestId((n) => n + 1);
      audioService.playRadioChirp();

      try {
        // Query Moss in-memory semantic retrieval engine
        const res = await mossEngine.query(text);
        setQueryResult(res);
        setLatencyMs(res.latencyMs);

        // SAFETY GATE — the single point deciding what may be spoken or sent.
        const protocol = matchedProtocol(res.outcome);

        if (protocol) {
          setActiveScenario(
            scenario ?? {
              id: 'scen_live_call',
              title: 'Live Inbound 911 Call (Real-Time Ingest)',
              tagline: 'Live voice audio / freeform speech transcribed & routed via Moss',
              iconName: 'PhoneCall',
              callerProfile: 'Live Caller (Direct Audio Stream)',
              callerSpeechTranscript: text,
              callerLocation: {
                address: 'Triangulating Cell Tower GPS',
                city: 'Metro Dispatch Sector 4',
                coordinates: '37.7749\u00b0 N, 122.4194\u00b0 W',
              },
              reportedVitals: {
                consciousness: 'TRIAGED IN REAL TIME',
                breathing: 'VAD MONITORED',
                pulse: protocol.cadenceBpm ? `${protocol.cadenceBpm} BPM TARGET` : 'MONITORED',
              },
              triagePriority: (protocol.triageLevel.includes('1')
                ? 'ESI-1 (Immediate Resuscitation)'
                : 'ESI-2 (Emergent)') as any,
            }
          );

          // Auto-assign CAD Unit — only ever for a matched protocol.
          setDispatchedUnit({
            id: 'MEDIC-14',
            name: 'Medic Engine 14 (ALS Paramedic Rescue)',
            type: protocol.unitRecommendation.unitType,
            station: 'Station 4 \u2022 Downtown Core',
            etaMinutes: Math.floor(Math.random() * 2) + 3, // Simulated demo ETA
            status: 'DISPATCHED',
            crew: 'Captain R. Torres, Paramedic J. Vance',
          });

          if (speakAudio && audioFeedbackEnabled) {
            audioService.speakVerbalInstruction(protocol.verbalResponseText);
          }

          if (protocol.cadenceBpm && isMetronomeActive) {
            audioService.startCprMetronome(protocol.cadenceBpm);
          }
        } else {
          // ABSTAIN: no protocol, no unit, no CPR pacer. Do not guess, do not
          // speak a clinical protocol, do not dispatch. Only the universal
          // zero-risk safety floor is spoken.
          setActiveScenario(scenario ?? null);
          setDispatchedUnit(null);
          setIsMetronomeActive(false);
          audioService.stopCprMetronome();

          if (speakAudio && audioFeedbackEnabled) {
            audioService.speakVerbalInstruction(UNIVERSAL_SAFETY_FLOOR);
          }
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

  const handleClearCall = useCallback(() => {
    audioService.stopSpeaking();
    audioService.stopCprMetronome();
    setIsMetronomeActive(false);
    setActiveScenario(null);
    setCurrentTranscript('');
    setQueryResult(null);
    setDispatchedUnit(null);
  }, []);

  return (
    <AuroraBackground
      showRadialGradient={activeTab !== 'console'}
      intensity={activeTab === 'console' ? 'vibrant' : 'subtle'}
      className="min-h-dvh text-slate-900 clinical-grid selection:bg-rose-500/20 selection:text-rose-600 overflow-x-clip"
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
                      handleProcessTranscript(scen.callerSpeechTranscript, scen, true);
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
                dispatchedUnit={dispatchedUnit}
                isMetronomeActive={isMetronomeActive}
                audioFeedbackEnabled={audioFeedbackEnabled}
                latencyMs={latencyMs}
                callRequestId={callRequestId}
                onProcessTranscript={(txt, scen) => handleProcessTranscript(txt, scen, true)}
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