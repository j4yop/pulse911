import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { CallerPanel } from './components/CallerPanel';
import { DispatcherHUD } from './components/DispatcherHUD';
import { LatencyBenchmark } from './components/LatencyBenchmark';
import { ArchitectureView } from './components/ArchitectureView';
import { PRDView } from './components/PRDView';
import { LandingView } from './components/LandingView';
import {
  MagneticDock,
  DockIconHome,
  DockIconSearch,
  DockIconFolder,
  DockIconMail,
  DockIconSettings,
} from '@/components/ui/magnetic-dock';
import { EmergencyScenario, MossQueryResult, DispatchedUnit } from './types';
import { EMERGENCY_SCENARIOS, EMERGENCY_PROTOCOLS } from './engine/emergencyProtocols';
import { mossEngine } from './engine/mossEngine';
import { audioService } from './engine/speechSimulation';
import confetti from 'canvas-confetti';

export const App: React.FC = () => {
  const TAB_IDS = ['overview', 'console', 'benchmark', 'architecture', 'prd'] as const;
  type TabId = (typeof TAB_IDS)[number];
  const initialTab = TAB_IDS.find((t) => t === new URLSearchParams(window.location.search).get('tab'));
  const [activeTab, setActiveTab] = useState<TabId>(initialTab ?? 'overview');

  // Deep-linkable tabs (?tab=benchmark) — shareable demo URLs for judges.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', activeTab);
    window.history.replaceState(null, '', url);
  }, [activeTab]);

  const handleSelectTab = (tab: TabId) => setActiveTab(tab);
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
      setIsProcessing(false);

      // Speak verbal instructions through Web Speech API if enabled
      if (speakAudio && audioFeedbackEnabled) {
        audioService.speakVerbalInstruction(res.protocol.verbalResponseText);
      }

      // If it is cardiac arrest, suggest metronome
      if (res.protocol.cadenceBpm && isMetronomeActive) {
        audioService.startCprMetronome(res.protocol.cadenceBpm);
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

  const dockItems = [
    {
      id: 'overview',
      label: 'Overview & Story',
      icon: <DockIconHome className="w-full h-full text-slate-800" />,
      isActive: activeTab === 'overview',
      onClick: () => handleSelectTab('overview'),
    },
    {
      id: 'console',
      label: 'Emergency Console',
      icon: <Radio className="w-full h-full text-rose-600" />,
      isActive: activeTab === 'console',
      onClick: () => handleSelectTab('console'),
      badge: activeScenario !== null ? 1 : undefined,
    },
    {
      id: 'benchmark',
      label: 'Moss vs Cloud DBs',
      icon: <DockIconSearch className="w-full h-full text-amber-500" />,
      isActive: activeTab === 'benchmark',
      onClick: () => handleSelectTab('benchmark'),
    },
    {
      id: 'architecture',
      label: 'Architecture Flow',
      icon: <DockIconFolder className="w-full h-full text-indigo-500" />,
      isActive: activeTab === 'architecture',
      onClick: () => handleSelectTab('architecture'),
    },
    {
      id: 'prd',
      label: 'Product Spec',
      icon: <DockIconMail className="w-full h-full text-emerald-600" />,
      isActive: activeTab === 'prd',
      onClick: () => handleSelectTab('prd'),
    },
    {
      id: 'settings',
      label: audioFeedbackEnabled ? 'Voice Guidance On (Click to Mute)' : 'Voice Guidance Muted (Click to Enable)',
      icon: <DockIconSettings className="w-full h-full text-slate-700" />,
      isActive: audioFeedbackEnabled,
      onClick: () => setAudioFeedbackEnabled(!audioFeedbackEnabled),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 clinical-grid flex flex-col selection:bg-rose-500/20 selection:text-rose-600">
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

      {/* Main Workspace */}
      <main className="flex-1 max-w-[1750px] w-full mx-auto p-4 sm:p-6 pb-28 sm:pb-36 space-y-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
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
            </motion.div>
          )}

          {activeTab === 'console' && (
            <motion.div
              key="console"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Clean Welcoming Hero Header */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-1">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold font-mono shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>POWERED BY MOSS (YC F25) &bull; SUB-10MS IN-PROCESS RETRIEVAL</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-sans">
                    Zero-Latency Emergency Dispatch Console
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-3xl">
                    Click any emergency scenario below or speak into the live microphone to test in-memory protocol retrieval under the 300ms human conversational threshold.
                  </p>
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
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative shadow-xs ${
                          isSelected
                            ? 'bg-rose-50/90 border-rose-500 ring-2 ring-rose-500/20 shadow-md'
                            : 'bg-white hover:bg-slate-50/80 border-slate-200/90 hover:border-slate-300'
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
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-xs grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
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
            </motion.div>
          )}

          {activeTab === 'benchmark' && (
            <motion.div
              key="benchmark"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <LatencyBenchmark />
            </motion.div>
          )}

          {activeTab === 'architecture' && (
            <motion.div
              key="architecture"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <ArchitectureView />
            </motion.div>
          )}

          {activeTab === 'prd' && (
            <motion.div
              key="prd"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <PRDView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/90 bg-white/90 backdrop-blur-md py-4 px-6 pb-28 sm:pb-24 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-2xs animate-pulse"></span>
          <span className="font-mono text-slate-700 font-medium">Pulse911 Runtime Active</span>
          <span className="text-slate-300">&bull;</span>
          <span className="font-mono text-emerald-700 font-semibold">
            {queryResult ? queryResult.engine : 'Retrieval runtime initializing — engine label appears after first query'}
          </span>
        </div>
        <div className="font-mono text-[11px] text-slate-400">
          Built for YC Fall 2026 &times; Moss Zero Latency Builder Sprint
        </div>
      </footer>

      {/* Floating macOS Magnetic Dock */}
      <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <MagneticDock
          items={dockItems}
          position="bottom"
          variant="glass"
          iconSize={48}
          maxScale={1.38}
          magneticDistance={130}
          className="shadow-2xl shadow-slate-900/15 border-slate-200/90 bg-white/85 backdrop-blur-2xl"
        />
      </div>
    </div>
  );
};

export default App;
