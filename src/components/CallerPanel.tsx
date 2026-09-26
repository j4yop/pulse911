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
  RotateCcw,
} from 'lucide-react';
import { EmergencyScenario } from '../types';
import { audioService } from '../engine/speechSimulation';

interface CallerPanelProps {
  onProcessTranscript: (text: string, scenario?: EmergencyScenario) => void;
  isProcessing: boolean;
  activeScenario: EmergencyScenario | null;
  currentTranscript: string;
  spokenInstruction?: string;
  onClearCall: () => void;
  /**
   * Measured retrieval latency for the current call, in ms.
   *
   * This badge used to read a hardcoded "Turnaround: < 264ms" — a fixed number
   * presented as a measurement. It now shows what was actually measured, and
   * says "measuring" until there is something to show.
   */
  retrievalLatencyMs?: number | null;
}

export const CallerPanel: React.FC<CallerPanelProps> = ({
  onProcessTranscript,
  isProcessing,
  activeScenario,
  currentTranscript,
  spokenInstruction,
  onClearCall,
  retrievalLatencyMs,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Web Speech recognition hook for live microphone
  const recognitionRef = useRef<any>(null);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  // Interim transcripts fire on every partial word. Buffer them and only dispatch
  // once the speaker pauses, so a single sentence does not trigger dozens of
  // retrievals + speech calls (this was a major source of runtime jank).
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef('');

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
        const text = transcript.trim();
        if (!text) return;

        latestRef.current = text;
        if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
        settleTimerRef.current = setTimeout(() => {
          const settled = latestRef.current.trim();
          if (settled) onProcessTranscript(settled);
        }, 650);
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

    return () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
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

  const isVoiceActive = isRecording || isProcessing || (activeScenario !== null);

  // Organic Audio Waveform Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const renderWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

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
  }, [isVoiceActive]);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      onProcessTranscript(customInput);
      setCustomInput('');
    }
  };

  const handleReplayInstruction = () => {
    if (spokenInstruction) {
      audioService.speakVerbalInstruction(spokenInstruction);
    }
  };

  return (
    <div className="clean-card flex flex-col min-h-[520px] sm:min-h-[640px] overflow-hidden">
      {/* Channel Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shadow-xs shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900">Caller Voice Channel</h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Ingestion
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">Real-time caller speech stream & automated audio guidance</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeScenario && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onClearCall}
              title="Reset Call"
              className="btn-tactile px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>Reset</span>
            </motion.button>
          )}

          <motion.button
            whileTap={{ scale: 0.96 }}
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
          </motion.button>
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

      {/* Medical Waveform Visualizer & Equalizer Bars */}
      <div className="px-4 sm:px-6 py-3 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between gap-4">
        <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5 shrink-0">
          <Volume2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Audio Ingestion Level</span>
        </span>

        <div className="flex items-center gap-3 min-w-0">
          {/* 12-Band Dynamic EQ Visualizer */}
          <div className="flex items-center gap-1 h-6 px-2 bg-slate-100/80 rounded-lg overflow-hidden">
            {[6, 12, 18, 14, 22, 16, 20, 10, 15, 8, 14, 18].map((h, i) => (
              <motion.div
                key={i}
                animate={
                  isVoiceActive
                    ? {
                        height: [4, h * 0.8, 4],
                        backgroundColor: i > 8 ? '#f43f5e' : '#10b981',
                      }
                    : { height: 3, backgroundColor: '#cbd5e1' }
                }
                transition={{
                  repeat: Infinity,
                  duration: 0.35 + (i % 3) * 0.1,
                  ease: 'easeInOut',
                }}
                className="w-1 rounded-full"
              />
            ))}
          </div>

          <div className="bg-white border border-slate-200/80 px-2.5 py-1 rounded-xl shadow-2xs hidden sm:block">
            <canvas ref={canvasRef} width={200} height={20} className="block" />
          </div>
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5">
        {/* Caller Speech Bubble */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5 text-slate-700 font-bold">
              <User className="w-3.5 h-3.5 text-slate-500" />
              Caller Inbound Speech:
            </span>
            {activeScenario?.callerLocation ? (
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                <MapPin className="w-3 h-3 text-slate-400" />
                {activeScenario.callerLocation.city}
              </span>
            ) : (
              /* A live call has no location because nothing supplies one. Showing
                 a map pin here would mean inventing one. */
              activeScenario && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <MapPin className="w-3 h-3 text-slate-300" />
                  No location data
                </span>
              )
            )}
          </div>

          <motion.div
            key={currentTranscript}
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 1 }}
            className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 text-slate-800 text-sm leading-relaxed shadow-inner"
          >
            {currentTranscript ? (
              <p className="font-medium text-slate-900 leading-relaxed font-sans">
                "{currentTranscript}"
              </p>
            ) : (
              <p className="text-slate-400 italic">
                Awaiting incoming call audio... Speak using the microphone or select a scenario above to test.
              </p>
            )}
          </motion.div>
        </div>

        {/* AI Voice Resuscitation Instruction Bubble */}
        {spokenInstruction && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="space-y-1.5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-rose-700">
              <span className="flex items-center gap-1.5 min-w-0">
                <Bot className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="truncate">AI Spoken Directive (Heard in Caller's Ear):</span>
              </span>

              <div className="flex items-center gap-2 shrink-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReplayInstruction}
                  className="px-2 py-0.5 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Replay Voice Instruction"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Replay Audio</span>
                </motion.button>

                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold font-mono">
                  Turnaround: {retrievalLatencyMs != null ? `${retrievalLatencyMs.toFixed(2)}ms measured` : 'measuring'}
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-rose-100/60 border border-rose-200/80 rounded-2xl p-4.5 text-slate-900 text-sm leading-relaxed shadow-xs">
              <p className="font-medium text-slate-950 leading-relaxed font-sans">
                "{spokenInstruction}"
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Quick Prompt Ideas & Custom Input */}
      <div className="border-t border-slate-100 bg-slate-50/60 p-4 space-y-3">
        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs text-slate-500">
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
            <motion.button
              key={promptText}
              type="button"
              whileHover={{ y: -2, scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 450, damping: 25 }}
              onClick={() => onProcessTranscript(promptText)}
              className="px-3 py-1 rounded-full bg-white hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 border border-slate-200 text-slate-700 font-medium whitespace-nowrap transition-colors cursor-pointer shadow-2xs text-[11px]"
            >
              {promptText}
            </motion.button>
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
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={!customInput.trim() || isProcessing}
            className="btn-tactile bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-xs"
          >
            <span>Dispatch</span>
            <Send className="w-3.5 h-3.5" />
          </motion.button>
        </form>
      </div>
    </div>
  );
};
