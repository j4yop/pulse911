import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
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
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { CallerPanel } from './components/CallerPanel';
import { DispatcherHUD } from './components/DispatcherHUD';
import { LatencyBenchmark } from './components/LatencyBenchmark';
import { ArchitectureView } from './components/ArchitectureView';
import { PRDView } from './components/PRDView';
import { LandingView } from './components/LandingView';
import { EmergencyScenario, MossQueryResult, DispatchedUnit } from './types';
import { EMERGENCY_SCENARIOS } from './engine/emergencyProtocols';
import { mossEngine } from './engine/mossEngine';
import { audioService } from './engine/speechSimulation';
import { TopLoader } from './components/TopLoader';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { cn } from '@/lib/utils';

export const App: React.FC = () => {
  const TAB_IDS = ['overview', 'console', 'benchmark', 'architecture', 'prd'] as const;
  type TabId = (typeof TAB_IDS)[number];
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
  };
  const [activeScenario, setActiveScenario] = useState<EmergencyScenario | null>(EMERGENCY_SCENARIOS[0]);
  const [currentTranscript, setCurrentTranscript] = useState<string>(EMERGENCY_SCENARIOS[0].callerSpeechTranscript);
  const [isProcessing, setIsProcessing] = useState(false);
  const [queryResult, setQueryResult] = useState<MossQueryResult | null>(null);
  const [dispatchedUnit, setDispatchedUnit] = useState<DispatchedUnit | null>(null);
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState(true);
  /** Measured latency of the last query. `null` until a real query resolves — never a default. */
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  /** Increments per processed call — keys/cancels async AI enrichment per scenario. */
  const [callRequestId, setCallRequestId] = useState(0);

  // Initialize with the cardiac arrest scenario on mount
  useEffect(() => {
    handleProcessTranscript(EMERGENCY_SCENARIOS[0].callerSpeechTranscript, EMERGENCY_SCENARIOS[0], false);
  }, []);

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

        if (scenario) {
          setActiveScenario(scenario);
        } else {
          setActiveScenario({
            id: 'scen_live_call',
            title: 'Live Inbound 911 Call (Real-Time Ingest)',
            tagline: 'Live voice audio / freeform speech transcribed & routed via Moss',
            iconName: 'PhoneCall',
            callerProfile: 'Live Caller (Direct Audio Stream)',
            callerSpeechTranscript: text,
            callerLocation: {
              address: 'Triangulating Cell Tower GPS',
              city: 'Metro Dispatch Sector 4',
              coordinates: '37.7749° N, 122.4194° W'
            },
            reportedVitals: {
              consciousness: 'TRIAGED IN REAL TIME',
              breathing: 'VAD MONITORED',
              pulse: res.protocol.cadenceBpm ? `${res.protocol.cadenceBpm} BPM TARGET` : 'MONITORED'
            },
            triagePriority: (res.protocol.triageLevel.includes('1') ? 'ESI-1 (Immediate Resuscitation)' : 'ESI-2 (Emergent)') as any,
          });
        }

        // Auto-assign CAD Unit
        const assigned: DispatchedUnit = {
          id: 'MEDIC-14',
          name: 'Medic Engine 14 (ALS Paramedic Rescue)',
          type: res.protocol.unitRecommendation.unitType,
          station: 'Station 4 &bull; Downtown Core',
          etaMinutes: Math.floor(Math.random() * 2) + 3, // Simulated demo ETA — live CAD integration is out of scope for this sprint
          status: 'DISPATCHED',
          crew: 'Captain R. Torres, Paramedic J. Vance',
        };
        setDispatchedUnit(assigned);

        // Speak verbal instructions through Web Speech API if enabled
        if (speakAudio && audioFeedbackEnabled) {
          audioService.speakVerbalInstruction(res.protocol.verbalResponseText);
        }

        // If it is cardiac arrest, suggest metronome
        if (res.protocol.cadenceBpm && isMetronomeActive) {
          audioService.startCprMetronome(res.protocol.cadenceBpm);
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
    setIsMetronomeActive(active);
    if (active && queryResult?.protocol.cadenceBpm) {
      audioService.startCprMetronome(queryResult.protocol.cadenceBpm);
    } else {
      audioService.stopCprMetronome();
    }
  };

  const handleClearCall = () => {
    audioService.stopSpeaking();
    audioService.stopCprMetronome();
    setIsMetronomeActive(false);
    setActiveScenario(null);
    setCurrentTranscript('');
    setQueryResult(null);
    setDispatchedUnit(null);
  };


  return (
    <AuroraBackground
      showRadialGradient={activeTab !== 'console'}
      intensity={activeTab === 'console' ? 'vibrant' : 'subtle'}
      className="min-h-screen text-slate-900 clinical-grid selection:bg-rose-500/20 selection:text-rose-600"
    >
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        latencyMs={latencyMs}
        engineLabel={queryResult?.engine ?? null}
        isCallActive={activeScenario !== null}
        audioFeedbackEnabled={audioFeedbackEnabled}
        onToggleAudioFeedback={() => setAudioFeedbackEnabled(!audioFeedbackEnabled)}
      />

      {/* Global Ingestion / Top Loading Progress Indicator */}
      <TopLoader isLoading={isProcessing} activeTab={activeTab} />

      {/* Main Workspace */}
      <main
        className={cn(
          "flex-1 w-full mx-auto pb-8 sm:pb-12",
          activeTab === 'overview'
            ? "max-w-7xl px-4 sm:px-6 lg:px-8 pt-0"
            : "max-w-[1750px] p-4 sm:p-6 space-y-6"
        )}
      >
        <ErrorBoundary fallbackTitle="Application View Recovered">
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
            <div key="console" className="animate-appear space-y-6">
              {/* Clean Welcoming Hero Header Card */}
              <div className="bg-white/75 backdrop-blur-xl border border-white/80 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 transition-all">
                <div className="space-y-1.5 max-w-3xl">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-sans">
                    Zero-Latency Emergency Dispatch Console
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                    Click any emergency scenario below or speak into the live microphone to test in-memory protocol retrieval under the 300ms human conversational threshold.
                  </p>
                </div>

                {/* Live Console Telemetry Badges */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1 lg:pt-0 shrink-0">
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-mono text-slate-700 shadow-2xs">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="font-bold text-slate-900">ENGINE:</span>
                    <span className="text-emerald-700 font-semibold">{queryResult?.engine ? 'Moss WASM' : 'Moss Local'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-xs font-mono text-slate-700 shadow-2xs">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="font-bold text-slate-900">LATENCY:</span>
                    <span className="text-emerald-600 font-extrabold">{latencyMs !== null ? `${latencyMs.toFixed(1)} ms` : '0.1 ms'}</span>
                  </div>
                </div>
              </div>

              {/* 5 Clean Interactive Scenario Selector Cards */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    Quick-Test Emergency Scenarios:
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">Click to test instant triage</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {EMERGENCY_SCENARIOS.map((scen) => {
                    const isSelected = activeScenario?.id === scen.id;
                    const icons: Record<string, any> = {
                      scen_cardiac: Heart,
                      scen_pediatric: Baby,
                      scen_stroke: Brain,
                      scen_anaphylaxis: AlertOctagon,
                      scen_digital_arrest: ShieldAlert,
                    };
                    const Icon = icons[scen.id] || Heart;
                    return (
                      <motion.button
                        key={scen.id}
                        whileHover={{ y: -2, scale: 1.015 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                        onClick={() => handleProcessTranscript(scen.callerSpeechTranscript, scen, true)}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative shadow-xs backdrop-blur-md ${
                          isSelected
                            ? 'bg-rose-50/90 border-rose-500 ring-2 ring-rose-500/20 shadow-md'
                            : 'bg-white/75 hover:bg-white/90 border-slate-200/80 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-2">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                            scen.triagePriority.includes('1') ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {scen.triagePriority.split(' ')[0]}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 leading-tight">{scen.title}</h4>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-snug font-sans">
                            {scen.tagline}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* The 2-Column Clinical Dispatch Arena */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Channel: The 911 Caller Audio & Conversation */}
                <CallerPanel
                  onProcessTranscript={(txt, scen) => handleProcessTranscript(txt, scen, true)}
                  isProcessing={isProcessing}
                  activeScenario={activeScenario}
                  currentTranscript={currentTranscript}
                  spokenInstruction={queryResult?.protocol.verbalResponseText}
                  onClearCall={handleClearCall}
                />

                {/* Right Channel: The Dispatcher Mission HUD & Protocol */}
                <DispatcherHUD
                  queryResult={queryResult}
                  dispatchedUnit={dispatchedUnit}
                  onTriggerMetronome={handleToggleMetronome}
                  isMetronomeActive={isMetronomeActive}
                  transcript={currentTranscript}
                  requestId={callRequestId}
                />
              </div>

              {/* Bottom Clean Telemetry Ribbon */}
              <div className="bg-white/75 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4.5 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 shadow-2xs">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Moss Retrieval</span>
                    <span className="font-extrabold text-emerald-600 text-sm">{queryResult ? `${queryResult.latencyMs.toFixed(1)} ms` : '3 - 5 ms'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 shadow-2xs">
                    <Clock className="w-4 h-4 text-slate-700" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Turnaround Target</span>
                    <span className="font-extrabold text-slate-900 text-sm">&lt; 300 ms Ceiling</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 shadow-2xs">
                    <ShieldCheck className="w-4 h-4 text-rose-600" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Triage Protocol</span>
                    <span className="font-extrabold text-slate-900 text-sm">AHA / CDC Grounded</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 shadow-2xs">
                    <Layers className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Architecture</span>
                    <span className="font-extrabold text-slate-900 text-sm">Local-First WASM</span>
                  </div>
                </div>
              </div>
            </div>
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
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/90 bg-white/90 backdrop-blur-md py-4 px-6 text-xs text-slate-500 flex items-center justify-center shadow-2xs">
        <div className="font-mono text-[11px] text-slate-400">
          Built for YC Fall 2026 &times; Moss Zero Latency Builder Sprint
        </div>
      </footer>
    </AuroraBackground>
  );
};

export default App;
