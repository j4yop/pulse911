import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  MapPin,
  Heart,
  Wind,
  Brain,
  AlertTriangle,
  Play,
  Volume2,
  Sparkles
} from 'lucide-react';
import { EmergencyScenario } from '../types';
import { EMERGENCY_SCENARIOS } from '../engine/emergencyProtocols';

interface CallerPanelProps {
  onProcessTranscript: (text: string, scenario?: EmergencyScenario) => void;
  isProcessing: boolean;
  activeScenario: EmergencyScenario | null;
  currentTranscript: string;
  onClearCall: () => void;
}

export const CallerPanel: React.FC<CallerPanelProps> = ({
  onProcessTranscript,
  isProcessing,
  activeScenario,
  currentTranscript,
  onClearCall,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [activePresetId, setActivePresetId] = useState<string | null>('scen_cardiac');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Web Speech recognition hook for live microphone
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          onProcessTranscript(transcript);
        }
      };

      rec.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, [onProcessTranscript]);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Web Speech API is not supported in this browser. Please use the scenario presets or type below.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        setActivePresetId(null);
      } catch (err) {
        console.error('Failed to start microphone:', err);
      }
    }
  };

  // Audio Waveform Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const renderWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isVoiceActive = isRecording || isProcessing || (activeScenario !== null);

      ctx.lineWidth = 2;
      ctx.strokeStyle = isVoiceActive ? '#f43f5e' : '#475569';
      ctx.beginPath();

      const sliceWidth = canvas.width / 50;
      let x = 0;

      for (let i = 0; i <= 50; i++) {
        const amplitude = isVoiceActive ? Math.sin(i * 0.3 + phase) * 14 + (Math.random() * 4) : 2;
        const y = canvas.height / 2 + amplitude;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.stroke();
      phase += isVoiceActive ? 0.15 : 0.02;
      animationFrameRef.current = requestAnimationFrame(renderWave);
    };

    renderWave();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording, isProcessing, activeScenario]);

  const handleSelectScenario = (scen: EmergencyScenario) => {
    setActivePresetId(scen.id);
    onProcessTranscript(scen.callerSpeechTranscript, scen);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      onProcessTranscript(customInput);
      setCustomInput('');
      setActivePresetId(null);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[780px] overflow-hidden shadow-2xl">
      {/* Channel Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <span>911 Inbound Audio Channel</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            </h2>
            <span className="text-[10px] text-slate-400 font-mono">Live Caller WebRTC Stream</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeScenario && (
            <button
              onClick={onClearCall}
              title="Hang up active call"
              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>End Call</span>
            </button>
          )}
          <button
            onClick={toggleMic}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-rose-400" />}
            <span>{isRecording ? 'Listening...' : 'Live Mic'}</span>
          </button>
        </div>
      </div>

      {/* Preset Emergency Scenarios (One-Click Testing) */}
      <div className="p-3 border-b border-slate-800 bg-slate-950/40">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-2 font-semibold flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Simulate 911 Emergency Scenarios (Zero Latency Triggers)
        </span>
        <div className="grid grid-cols-2 gap-2">
          {EMERGENCY_SCENARIOS.map((scen) => {
            const isSelected = activePresetId === scen.id;
            return (
              <button
                key={scen.id}
                onClick={() => handleSelectScenario(scen)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-rose-500 bg-rose-500/10 shadow-inner'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-bold text-white truncate">{scen.title}</span>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                    {scen.triagePriority.split(' ')[0]}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug line-clamp-1">{scen.tagline}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Audio Visualizer Canvas */}
      <div className="px-4 py-2 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-slate-400" />
          <span className="text-[11px] font-mono text-slate-400">Audio Waveform:</span>
        </div>
        <canvas ref={canvasRef} width={280} height={34} className="rounded" />
      </div>

      {/* Caller Details & Streaming Transcript Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Caller Metadata Card */}
        {activeScenario && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-400 pb-1.5 border-b border-slate-800/80">
              <span className="flex items-center gap-1.5 text-white font-semibold">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                {activeScenario.callerLocation.address}, {activeScenario.callerLocation.city}
              </span>
              <span className="text-[10px] text-slate-500">{activeScenario.callerLocation.coordinates}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div>
                <span className="text-[10px] text-slate-500 block">Consciousness:</span>
                <span className="text-amber-400 font-semibold text-[11px]">{activeScenario.reportedVitals.consciousness}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Breathing:</span>
                <span className="text-rose-400 font-semibold text-[11px]">{activeScenario.reportedVitals.breathing}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Pulse:</span>
                <span className="text-emerald-400 font-semibold text-[11px]">{activeScenario.reportedVitals.pulse}</span>
              </div>
            </div>
          </div>
        )}

        {/* Live Speech-to-Text Transcript Feed */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-rose-500" />
              Live Caller Audio Transcript
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {isProcessing ? 'Moss Indexing...' : 'Real-Time'}
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 min-h-[160px] text-xs leading-relaxed font-mono text-slate-200 shadow-inner">
            {currentTranscript ? (
              <p className="whitespace-pre-wrap">"{currentTranscript}"</p>
            ) : (
              <p className="text-slate-500 italic">
                Awaiting incoming 911 audio stream. Click one of the emergency presets above or activate Live Mic to begin speech ingestion...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Manual Input Form */}
      <form onSubmit={handleCustomSubmit} className="p-3 border-t border-slate-800 bg-slate-950/70 flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="Speak or type custom emergency directive..."
          className="flex-1 bg-slate-900 border border-slate-700 focus:border-rose-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={!customInput.trim() || isProcessing}
          className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0"
        >
          Dispatch
        </button>
      </form>
    </div>
  );
};
