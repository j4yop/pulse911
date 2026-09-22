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
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);

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
      setSpeechNotice('Live microphone requires Chrome/Edge Web Speech API. Use the 5 one-click presets below for full simulation.');
      setTimeout(() => setSpeechNotice(null), 4500);
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
    <div className="double-bezel-shell flex flex-col min-h-[680px] xl:h-[820px]">
      <div className="double-bezel-core flex-1 flex flex-col overflow-hidden">
        {/* Channel Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200/80 text-rose-600 flex items-center justify-center shadow-xs">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 font-sans">
                  Inbound 911 Audio Feed
                </h2>
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  LIVE CAD INGEST
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Web Audio Stream &bull; Live VAD Oscilloscope</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeScenario && (
              <button
                onClick={onClearCall}
                title="Hang up active call"
                className="btn-tactile px-3 py-1.5 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
            <button
              onClick={toggleMic}
              className={`btn-tactile px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs ${
                isRecording
                  ? 'bg-rose-600 text-white shadow-rose-600/30 shadow-md animate-pulse'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-white animate-ping' : 'bg-rose-500'}`} />
              {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-rose-600" />}
              <span>{isRecording ? 'Live Mic Recording...' : 'Live Microphone'}</span>
            </button>
          </div>
        </div>

        {/* Browser Notice if microphone unsupported */}
        {speechNotice && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-amber-900 text-[11px] font-mono flex items-center justify-between">
            <span>⚠️ {speechNotice}</span>
            <button onClick={() => setSpeechNotice(null)} className="text-amber-700 hover:text-amber-900 font-bold ml-2 cursor-pointer">&times;</button>
          </div>
        )}

        {/* Preset Emergency Scenarios (One-Click Testing) */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/40">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-600 font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Simulated Clinical Emergency Presets
            </span>
            <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
              One-Click Stress Test
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {EMERGENCY_SCENARIOS.map((scen) => {
              const isSelected = activePresetId === scen.id;
              const Icon = getScenarioIcon(scen.id);
              return (
                <motion.button
                  key={scen.id}
                  layout
                  whileHover={{ y: -2, scale: 1.015 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                  onClick={() => handleSelectScenario(scen)}
                  className={`btn-tactile p-3.5 rounded-2xl border text-left transition-colors cursor-pointer flex flex-col justify-between relative group ${
                    isSelected
                      ? 'border-rose-500 bg-rose-50/70 shadow-sm ring-2 ring-rose-500/20'
                      : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2 w-full">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-rose-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 group-hover:text-rose-600 group-hover:bg-rose-50'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 leading-tight">{scen.title}</h4>
                        <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[160px]">{scen.callerProfile}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full font-bold shrink-0 ${
                        scen.triagePriority.includes('1')
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {scen.triagePriority.split(' ')[0]}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1 font-mono italic">
                    "{scen.callerSpeechTranscript}"
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Live Audio Visualizer Canvas (Medical Oscilloscope) */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-600 font-semibold uppercase">Bio-Oscilloscope:</span>
            <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
              48kHz &bull; Opus VAD
            </span>
          </div>
          <div className="bg-white border border-slate-200/90 px-3 py-1.5 rounded-xl shadow-inner ecg-grid flex items-center justify-center">
            <canvas ref={canvasRef} width={340} height={36} className="rounded block" />
          </div>
        </div>

        {/* Caller Details & Streaming Transcript Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {/* Caller Metadata Card */}
          {activeScenario && (
            <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 space-y-3 text-xs font-mono shadow-2xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80">
                <span className="flex items-center gap-2 text-slate-900 font-bold">
                  <MapPin className="w-4 h-4 text-rose-600" />
                  <span>{activeScenario.callerLocation.address}, {activeScenario.callerLocation.city}</span>
                </span>
                <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200 font-semibold">
                  GPS: {activeScenario.callerLocation.coordinates}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Consciousness:</span>
                  <span className="text-amber-700 font-extrabold text-xs block mt-0.5">{activeScenario.reportedVitals.consciousness}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Respiration:</span>
                  <span className="text-rose-700 font-extrabold text-xs block mt-0.5">{activeScenario.reportedVitals.breathing}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Cardiac Pulse:</span>
                  <span className="text-emerald-700 font-extrabold text-xs block mt-0.5">{activeScenario.reportedVitals.pulse}</span>
                </div>
              </div>
            </div>
          )}

          {/* Live Speech-to-Text Transcript Feed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900">
              <span className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-rose-600" />
                Live Inbound Voice Transcription
              </span>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold">
                {isProcessing ? 'Moss Semantic Tokenizing...' : 'Live Audio Ingestion (Web Audio)'}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 min-h-[170px] text-xs leading-relaxed font-mono text-slate-800 shadow-inner">
              {currentTranscript ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pb-1 border-b border-slate-200/60 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>AUDIO STREAM SYNCHRONIZED</span>
                  </div>
                  <p className="whitespace-pre-wrap font-medium text-slate-900 text-sm leading-relaxed">
                    "{currentTranscript}"
                  </p>
                </div>
              ) : (
                <p className="text-slate-400 italic">
                  Awaiting incoming 911 audio stream. Click one of the emergency presets above or activate Live Mic to begin speech ingestion...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Manual Input Form */}
        <form onSubmit={handleCustomSubmit} className="p-3.5 border-t border-slate-100 bg-slate-50/70 flex gap-2.5">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Type or speak custom emergency directive (e.g. 'fentanyl overdose narcan rescue breathing')..."
            className="flex-1 bg-white border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all shadow-2xs font-mono"
          />
          <button
            type="submit"
            disabled={!customInput.trim() || isProcessing}
            className="btn-tactile bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0 flex items-center gap-2 group"
          >
            <span>Dispatch</span>
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
              <Send className="w-3 h-3 text-white" />
            </div>
          </button>
        </form>
      </div>
    </div>
  );
};

