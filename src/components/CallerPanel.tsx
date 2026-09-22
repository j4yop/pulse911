import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
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
  Volume2,
  Sparkles,
  Radio,
  Send,
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

  // Audio Waveform Animation in Light Theme
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
      ctx.strokeStyle = isVoiceActive ? '#e11d48' : '#94a3b8';
      ctx.beginPath();

      const sliceWidth = canvas.width / 50;
      let x = 0;

      for (let i = 0; i <= 50; i++) {
        const amplitude = isVoiceActive ? Math.sin(i * 0.3 + phase) * 12 + (Math.random() * 3) : 1.5;
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

  const getScenarioIcon = (id: string) => {
    switch (id) {
      case 'scen_cardiac':
        return Heart;
      case 'scen_choking':
        return Wind;
      case 'scen_stroke':
        return Brain;
      case 'scen_anaphylaxis':
        return AlertTriangle;
      default:
        return PhoneCall;
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl flex flex-col h-[780px] overflow-hidden shadow-sm">
      {/* Channel Header */}
      <div className="px-4 py-3 border-b border-slate-200/80 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-2xs">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span>911 Inbound Audio Channel</span>
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">Live Caller WebRTC Stream</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeScenario && (
            <button
              onClick={onClearCall}
              title="Hang up active call"
              className="btn-tactile px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>End Call</span>
            </button>
          )}
          <button
            onClick={toggleMic}
            className={`btn-tactile px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300/80'
            }`}
          >
            {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-rose-600" />}
            <span>{isRecording ? 'Listening...' : 'Live Mic'}</span>
          </button>
        </div>
      </div>

      {/* Preset Emergency Scenarios (One-Click Testing) */}
      <div className="p-3.5 border-b border-slate-200/80 bg-slate-50/50">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-600 font-bold flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500" />
            Simulate 911 Emergency Scenarios (Zero Latency Triggers)
          </span>
          <span className="text-[10px] font-mono text-slate-500">Click to Triage</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {EMERGENCY_SCENARIOS.map((scen) => {
            const isSelected = activePresetId === scen.id;
            const Icon = getScenarioIcon(scen.id);
            return (
              <button
                key={scen.id}
                onClick={() => handleSelectScenario(scen)}
                className={`btn-tactile p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-rose-500 bg-rose-50/70 shadow-xs ring-2 ring-rose-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-rose-600' : 'text-slate-500'}`} />
                    <span className="text-xs font-bold text-slate-900 truncate">{scen.title}</span>
                  </div>
                  <span
                    className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold shrink-0 ${
                      scen.triagePriority.includes('1')
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {scen.triagePriority.split(' ')[0]}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug line-clamp-1">{scen.tagline}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Audio Visualizer Canvas */}
      <div className="px-4 py-2 border-b border-slate-200/80 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-slate-500" />
          <span className="text-[11px] font-mono text-slate-600 font-semibold">Caller Voice Waveform:</span>
        </div>
        <div className="bg-white border border-slate-200 px-2 py-0.5 rounded-lg shadow-2xs">
          <canvas ref={canvasRef} width={280} height={30} className="rounded block" />
        </div>
      </div>

      {/* Caller Details & Streaming Transcript Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Caller Metadata Card */}
        {activeScenario && (
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-2.5 text-xs font-mono shadow-2xs">
            <div className="flex items-center justify-between text-slate-600 pb-2 border-b border-slate-200">
              <span className="flex items-center gap-1.5 text-slate-900 font-bold">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                {activeScenario.callerLocation.address}, {activeScenario.callerLocation.city}
              </span>
              <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {activeScenario.callerLocation.coordinates}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-0.5">
              <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                <span className="text-[10px] text-slate-500 block uppercase font-medium">Consciousness:</span>
                <span className="text-amber-700 font-bold text-[11px]">{activeScenario.reportedVitals.consciousness}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                <span className="text-[10px] text-slate-500 block uppercase font-medium">Breathing:</span>
                <span className="text-rose-700 font-bold text-[11px]">{activeScenario.reportedVitals.breathing}</span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200/80">
                <span className="text-[10px] text-slate-500 block uppercase font-medium">Pulse:</span>
                <span className="text-emerald-700 font-bold text-[11px]">{activeScenario.reportedVitals.pulse}</span>
              </div>
            </div>
          </div>
        )}

        {/* Live Speech-to-Text Transcript Feed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
              Live Caller Audio Transcript
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
              {isProcessing ? 'Moss Indexing...' : 'Real-Time Stream'}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[160px] text-xs leading-relaxed font-mono text-slate-800 shadow-inner">
            {currentTranscript ? (
              <p className="whitespace-pre-wrap font-medium">"{currentTranscript}"</p>
            ) : (
              <p className="text-slate-400 italic">
                Awaiting incoming 911 audio stream. Click one of the emergency presets above or activate Live Mic to begin speech ingestion...
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Manual Input Form */}
      <form onSubmit={handleCustomSubmit} className="p-3 border-t border-slate-200 bg-slate-50/80 flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="Speak or type custom emergency directive (e.g. 'fentanyl overdose')..."
          className="flex-1 bg-white border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all shadow-2xs font-mono"
        />
        <button
          type="submit"
          disabled={!customInput.trim() || isProcessing}
          className="btn-tactile bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Dispatch</span>
        </button>
      </form>
    </div>
  );
};

