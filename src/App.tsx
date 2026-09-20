import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { CallerPanel } from './components/CallerPanel';
import { DispatcherHUD } from './components/DispatcherHUD';
import { LatencyBenchmark } from './components/LatencyBenchmark';
import { ArchitectureView } from './components/ArchitectureView';
import { PRDView } from './components/PRDView';
import { EmergencyScenario, MossQueryResult, DispatchedUnit } from './types';
import { EMERGENCY_SCENARIOS, EMERGENCY_PROTOCOLS } from './engine/emergencyProtocols';
import { mossEngine } from './engine/mossEngine';
import { audioService } from './engine/speechSimulation';
import confetti from 'canvas-confetti';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'console' | 'benchmark' | 'architecture' | 'prd'>('console');
  const [activeScenario, setActiveScenario] = useState<EmergencyScenario | null>(EMERGENCY_SCENARIOS[0]);
  const [currentTranscript, setCurrentTranscript] = useState<string>(EMERGENCY_SCENARIOS[0].callerSpeechTranscript);
  const [isProcessing, setIsProcessing] = useState(false);
  const [queryResult, setQueryResult] = useState<MossQueryResult | null>(null);
  const [dispatchedUnit, setDispatchedUnit] = useState<DispatchedUnit | null>(null);
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState(true);
  const [latencyMs, setLatencyMs] = useState(3.6);

  // Initialize with the cardiac arrest scenario on mount
  useEffect(() => {
    handleProcessTranscript(EMERGENCY_SCENARIOS[0].callerSpeechTranscript, EMERGENCY_SCENARIOS[0], false);
  }, []);

  const handleProcessTranscript = useCallback(
    async (text: string, scenario?: EmergencyScenario, speakAudio = true) => {
      setIsProcessing(true);
      setCurrentTranscript(text);
      if (scenario) {
        setActiveScenario(scenario);
      }

      // Play emergency radio sound effect
      audioService.playRadioChirp();

      // Query Moss in-memory semantic retrieval engine
      const res = await mossEngine.query(text);
      setQueryResult(res);
      setLatencyMs(res.latencyMs);

      // Auto-assign CAD Unit
      const assigned: DispatchedUnit = {
        id: 'MEDIC-14',
        name: 'Medic Engine 14 (ALS Paramedic Rescue)',
        type: res.protocol.unitRecommendation.unitType,
        station: 'Station 4 &bull; Downtown Core',
        etaMinutes: Math.floor(Math.random() * 2) + 3, // 3 - 4 mins
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500/20 selection:text-rose-400">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        latencyMs={latencyMs}
        isCallActive={activeScenario !== null}
        audioFeedbackEnabled={audioFeedbackEnabled}
        onToggleAudioFeedback={() => setAudioFeedbackEnabled(!audioFeedbackEnabled)}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-[1750px] w-full mx-auto p-4 sm:p-6 space-y-6">
        {activeTab === 'console' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-in fade-in duration-200">
            {/* Left Channel: The 911 Caller Audio & Scenarios */}
            <CallerPanel
              onProcessTranscript={(txt, scen) => handleProcessTranscript(txt, scen, true)}
              isProcessing={isProcessing}
              activeScenario={activeScenario}
              currentTranscript={currentTranscript}
              onClearCall={handleClearCall}
            />

            {/* Right Channel: The Dispatcher Mission HUD & Moss Telemetry */}
            <DispatcherHUD
              queryResult={queryResult}
              dispatchedUnit={dispatchedUnit}
              onTriggerMetronome={handleToggleMetronome}
              isMetronomeActive={isMetronomeActive}
            />
          </div>
        )}

        {activeTab === 'benchmark' && <LatencyBenchmark />}
        {activeTab === 'architecture' && <ArchitectureView />}
        {activeTab === 'prd' && <PRDView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-mono text-slate-400">Pulse911 Runtime Active</span>
          <span>&bull;</span>
          <span className="font-mono text-emerald-400">Moss (YC F25) In-Memory Engine</span>
        </div>
        <div className="font-mono text-[11px] text-slate-500">
          Built for YC Fall 2026 &times; Moss Zero Latency Builder Sprint
        </div>
      </footer>
    </div>
  );
};

export default App;
