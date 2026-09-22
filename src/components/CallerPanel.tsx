import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  MapPin,
  Volume2,
  Sparkles,
  Send,
  User,
  Bot,
} from 'lucide-react';
import { EmergencyScenario } from '../types';

interface CallerPanelProps {
  onProcessTranscript: (text: string, scenario?: EmergencyScenario) => void;
  isProcessing: boolean;
  activeScenario: EmergencyScenario | null;
  currentTranscript: string;
  spokenInstruction?: string;
  onClearCall: () => void;
}

export const CallerPanel: React.FC<CallerPanelProps> = ({
  onProcessTranscript,
  isProcessing,
  activeScenario,
  currentTranscript,
  spokenInstruction,
  onClearCall,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [customInput, setCustomInput] = useState('');
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
      setSpeechNotice('Live microphone requires Chrome/Edge Web Speech API. You can also type in the box below.');
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
      } catch (err) {
        console.error('Failed to start microphone:', err);
      }
    }
  };

  // Organic Audio Waveform Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const renderWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isVoiceActive = isRecording || isProcessing || (activeScenario !== null);

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = isVoiceActive ? '#e11d48' : '#cbd5e1';
      ctx.beginPath();

      const sliceWidth = canvas.width / 60;
      let x = 0;

      for (let i = 0; i <= 60; i++) {
        const amplitude = isVoiceActive ? Math.sin(i * 0.25 + phase) * 10 + (Math.random() * 2) : 1;
        const y = canvas.height / 2 + amplitude;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.stroke();
      phase += isVoiceActive ? 0.12 : 0.02;
      animationFrameRef.current = requestAnimationFrame(renderWave);
    };

    renderWave();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording, isProcessing, activeScenario]);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      onProcessTranscript(customInput);
      setCustomInput('');
    }
  };

  return (
    <div className="clean-card flex flex-col min-h-[640px] overflow-hidden">
      {/* Channel Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shadow-xs">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Caller Voice Channel</h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Ingestion
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Real-time caller speech stream & automated audio guidance</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeScenario && (
            <button
              onClick={onClearCall}
              title="Reset Call"
              className="btn-tactile px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          <button
            onClick={toggleMic}
            className={`btn-tactile px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
              isRecording
                ? 'bg-rose-600 text-white shadow-rose-600/30 animate-pulse'
                : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-white animate-ping' : 'bg-rose-500'}`} />
            {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-rose-600" />}
            <span>{isRecording ? 'Listening...' : 'Live Mic'}</span>
          </button>
        </div>
      </div>

      {/* Active Recording Banner */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 py-2.5 bg-rose-600 text-white text-xs font-medium flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>Listening to your voice... Speak any emergency in English (e.g. "My roommate collapsed, not breathing")</span>
            </div>
            <button
              onClick={toggleMic}
              className="text-white/80 hover:text-white text-xs font-bold underline cursor-pointer"
            >
              Stop
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Browser Notice */}
      {speechNotice && (
        <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center justify-between">
          <span>⚠️ {speechNotice}</span>
          <button onClick={() => setSpeechNotice(null)} className="text-amber-700 hover:text-amber-900 font-bold ml-2 cursor-pointer">&times;</button>
        </div>
      )}

      {/* Medical Waveform Visualizer */}
      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5 text-slate-400" />
          <span>Audio Ingestion Level</span>
        </span>
        <div className="bg-white border border-slate-200/80 px-3 py-1 rounded-xl shadow-2xs">
          <canvas ref={canvasRef} width={280} height={24} className="block" />
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 p-6 overflow-y-auto space-y-5">
        {/* Caller Speech Bubble */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5 text-slate-700 font-bold">
              <User className="w-3.5 h-3.5 text-slate-500" />
              Caller Inbound Speech:
            </span>
            {activeScenario && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                {activeScenario.callerLocation.city}
              </span>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 text-slate-800 text-sm leading-relaxed shadow-inner">
            {currentTranscript ? (
              <p className="font-medium text-slate-900 leading-relaxed">
                "{currentTranscript}"
              </p>
            ) : (
              <p className="text-slate-400 italic">
                Awaiting incoming call audio... Speak using the microphone or select a scenario above to test.
              </p>
            )}
          </div>
        </div>

        {/* AI Voice Resuscitation Instruction Bubble */}
        {spokenInstruction && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-1.5"
          >
            <div className="flex items-center justify-between text-xs font-bold text-rose-700">
              <span className="flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-rose-600" />
                <span>AI Spoken Directive (Heard in Caller's Ear):</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                Spoken Aloud
              </span>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-rose-100/60 border border-rose-200/80 rounded-2xl p-4.5 text-slate-900 text-sm leading-relaxed shadow-xs">
              <p className="font-medium text-slate-950 leading-relaxed">
                "{spokenInstruction}"
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Quick Prompt Ideas & Custom Input */}
      <div className="border-t border-slate-100 bg-slate-50/60 p-4 space-y-3">
        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-500">
          <span className="font-semibold text-slate-600 text-[11px] shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Try prompts:
          </span>
          {[
            'Toddler swallowed bleach',
            'Severe bee sting allergy',
            'Fentanyl overdose unresponsive',
            'Grandmother face drooping stroke',
            'Severe chest pain sweating',
          ].map((promptText) => (
            <button
              key={promptText}
              type="button"
              onClick={() => onProcessTranscript(promptText)}
              className="px-3 py-1 rounded-full bg-white hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 border border-slate-200 text-slate-700 font-medium whitespace-nowrap transition-colors cursor-pointer shadow-2xs text-[11px]"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Custom Input Form */}
        <form onSubmit={handleCustomSubmit} className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Type any emergency symptom (e.g. 'My 9-month-old baby swallowed a coin')..."
            className="flex-1 bg-white border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition-all shadow-xs"
          />
          <button
            type="submit"
            disabled={!customInput.trim() || isProcessing}
            className="btn-tactile bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-xs"
          >
            <span>Dispatch</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
