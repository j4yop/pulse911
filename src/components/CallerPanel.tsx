import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Info,
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

/**
 * Microphone lifecycle, surfaced rather than inferred.
 *
 * `idle` nothing · `starting` requested, not yet live · `listening` live
 * recogniser · `unavailable` no API or no device · `denied` permission blocked
 * · `error` service or network failure.
 */
export type MicState = 'idle' | 'starting' | 'listening' | 'unavailable' | 'denied' | 'error';

interface CallerPanelProps {
  /** `source` is surfaced in the UI so an operator always knows whether the engine
   *  received speech or typed text. */
  onProcessTranscript: (text: string, scenario?: EmergencyScenario, source?: 'mic' | 'typed') => void;
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
  /** Fires whenever the microphone lifecycle changes, so the dock can mirror it. */
  onMicStateChange?: (state: MicState) => void;
  /**
   * While a clarifying question is pending, speech is an ANSWER, not a new
   * emergency description. Returns true when it handled the utterance, so the
   * recogniser knows not to also dispatch it to triage.
   */
  onSpokenAnswer?: (spoken: string) => boolean;
  /** Set while an answer is expected, so the banner can say so. */
  awaitingAnswerFor?: string | null;
  /** What speech was heard but not understood, so the operator can see it. */
  clarifyHeard?: string | null;
}

export const CallerPanel: React.FC<CallerPanelProps> = ({
  onProcessTranscript,
  isProcessing,
  activeScenario,
  currentTranscript,
  spokenInstruction,
  onClearCall,
  retrievalLatencyMs,
  onMicStateChange,
  onSpokenAnswer,
  awaitingAnswerFor,
  clarifyHeard,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // ── Microphone state, made visible ────────────────────────────────────────
  // The mic used to fail silently: `onerror` only console.warn'd, and `onend`
  // fired on every natural pause in Chrome, so the operator saw a live-looking
  // button and got nothing. For a product whose primary interaction is voice,
  // silence that looks like listening is the worst possible failure mode.
  const [micState, setMicState] = useState<MicState>('idle');
  /** Live RMS level 0..1 from a real AnalyserNode, not a decorative animation. */
  const [micLevel, setMicLevel] = useState(0);
  /** True once the recogniser reports speech — distinguishes "silent room" from "dead mic". */
  const [heardSpeech, setHeardSpeech] = useState(false);
  /** Interim words, so the operator can see what is being heard right now. */
  const [interimTranscript, setInterimTranscript] = useState('');

  /** Live means the operator asked for the mic and it has not failed. */
  const micActive = micState === 'starting' || micState === 'listening';
  const micLabel =
    micState === 'starting'
      ? 'Starting...'
      : micState === 'listening'
        ? heardSpeech
          ? 'Listening...'
          : 'Listening (no speech yet)'
        : micState === 'denied'
          ? 'Mic blocked'
          : micState === 'unavailable'
            ? 'Mic unavailable'
            : micState === 'error'
              ? 'Mic error — retry'
              : 'Live Mic';

  /**
   * Whether the operator still WANTS the mic on. Chrome ends a continuous
   * recognition session after a pause, so `onend` is not a user intent — it is a
   * routine lifecycle event. Auto-restart is driven by this flag, not by
   * `isRecording`, so a deliberate stop is respected.
   */
  const wantsToListenRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Guards against a hot restart loop if the service is failing every start. */
  const consecutiveFailuresRef = useRef(0);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const levelFrameRef = useRef<number | null>(null);
  // Web Speech recognition hook for live microphone
  const recognitionRef = useRef<any>(null);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);
  // Interim transcripts fire on every partial word. Buffer them and only dispatch
  // once the speaker pauses, so a single sentence does not trigger dozens of
  // retrievals + speech calls (this was a major source of runtime jank).
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef('');
  /**
   * The latest submit callback, read through a ref.
   *
   * The recogniser used to depend on `onProcessTranscript` directly. That prop is
   * an inline arrow in the parent, so it had a new identity on every render,
   * which tore down and rebuilt the recogniser every render — and the cleanup
   * forced `wantsToListen = false` and stopped the microphone. The mic could
   * therefore never stay live: `start()` was called, `onstart` fired, and the
   * state was immediately torn down again.
   */
  const submitRef = useRef(onProcessTranscript);
  submitRef.current = onProcessTranscript;
  const onSpokenAnswerRef = useRef(onSpokenAnswer);
  onSpokenAnswerRef.current = onSpokenAnswer;

  const setMic = (next: MicState) => {
    micStateRef.current = next;
    setMicState(next);
  };

  /**
   * A REAL input level, from the actual microphone stream.
   *
   * The waveform on this panel is decorative. It cannot tell a working mic from
   * a dead one, which is precisely the distinction the operator needs. This reads
   * RMS from an AnalyserNode on the genuine capture stream, so "I am not hearing
   * anything" becomes a fact the UI can show rather than a guess.
   */
  const startLevelMeter = async () => {
    stopLevelMeter();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        setMicLevel(Math.min(1, Math.sqrt(sum / buf.length) * 4));
        levelFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // No level meter is survivable: the recogniser still works without it.
      setMicLevel(0);
    }
  };

  const stopLevelMeter = () => {
    if (levelFrameRef.current) cancelAnimationFrame(levelFrameRef.current);
    levelFrameRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    setMicLevel(0);
  };

  const failNotice = (message: string) => {
    setSpeechNotice(message);
    if (speechNoticeTimerRef.current) clearTimeout(speechNoticeTimerRef.current);
    // Errors stay up long enough to be read and acted on, unlike the transient
    // "unsupported browser" toast.
    speechNoticeTimerRef.current = setTimeout(() => setSpeechNotice(null), 9000);
  };

  const speechNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const micStateRef = useRef<MicState>('idle');

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        let transcript = '';
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) transcript += chunk;
          else interim += chunk;
        }
        const text = (transcript + interim).trim();
        if (text) {
          setHeardSpeech(true);
          if (micStateRef.current === 'starting') setMic('listening');
          // Show the operator what is being heard, live, instead of nothing
          // until 650ms after they stop talking.
          setInterimTranscript(text);
        }

        const final = transcript.trim();
        if (!final) return;

        // A pending clarifying question changes what speech MEANS. While one is
        // open, the operator is answering it — so "no" is an answer, not a
        // patient description to be triaged.
        if (onSpokenAnswerRef.current?.(final)) {
          setInterimTranscript('');
          return;
        }

        latestRef.current = final;
        if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
        settleTimerRef.current = setTimeout(() => {
          const settled = latestRef.current.trim();
          if (settled) submitRef.current(settled, undefined, 'mic');
        }, 650);
      };

      rec.onstart = () => {
        consecutiveFailuresRef.current = 0;
        setMic('listening');
        setIsRecording(true);
        setSpeechNotice(null);
      };

      /**
       * Errors were previously swallowed into the console. Every one of these is
       * something the operator can act on, so every one gets said out loud.
       */
      rec.onerror = (e: any) => {
        const code = e?.error ?? 'unknown';
        consecutiveFailuresRef.current += 1;
        setIsRecording(false);
        if (code === 'not-allowed' || code === 'service-not-allowed') {
          wantsToListenRef.current = false;
          setMic('denied');
          failNotice('Microphone blocked. Allow microphone access in your browser, or type the symptoms below.');
        } else if (code === 'audio-capture') {
          wantsToListenRef.current = false;
          setMic('unavailable');
          failNotice('No microphone found. Connect one, or type the symptoms below.');
        } else if (code === 'network') {
          // The Web Speech API transcribes in Google’s cloud. This is the single
          // most likely real-world failure, and it must not look like silence.
          setMic('error');
          failNotice('Speech service unreachable (network). Transcription needs an internet connection — type the symptoms below, or retry.');
        } else if (code === 'no-speech') {
          setMic('listening');
          setHeardSpeech(false);
          failNotice('No speech detected. Still listening — tap Stop if you are done.');
        } else if (code !== 'aborted') {
          setMic('error');
          failNotice(`Speech recognition error (${code}). Tap Live Mic to retry, or type the symptoms below.`);
        }
      };

      /**
       * Chrome ends a `continuous` session after a pause. That is NOT the
       * operator stopping, so the mic used to go dead mid-call with no signal at
       * all. Now it restarts itself while the operator still wants it listening.
       */
      rec.onend = () => {
        setIsRecording(false);
        setMicLevel(0);
        if (!wantsToListenRef.current) {
          if (micStateRef.current !== 'idle') setMic('idle');
          return;
        }
        if (consecutiveFailuresRef.current >= 4) {
          // The service is failing every start. Stop hammering it and say so.
          wantsToListenRef.current = false;
          setMic('error');
          failNotice('Speech recognition keeps stopping. Tap Live Mic to retry, or type the symptoms below.');
          return;
        }
        setMic('starting');
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
        restartTimerRef.current = setTimeout(() => {
          try {
            rec.start();
          } catch {
            /* already starting — the next onend will retry */
          }
        }, 250);
      };

      recognitionRef.current = rec;
    }

    return () => {
      wantsToListenRef.current = false;
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (speechNoticeTimerRef.current) clearTimeout(speechNoticeTimerRef.current);
      stopLevelMeter();
      try {
        recognitionRef.current?.stop();
      } catch {
        /* not running */
      }
    };
    // Intentionally empty: the recogniser is built once for the session. The
    // submit callback is read through `submitRef` so a new function identity on
    // every render cannot restart or tear down the microphone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      setMic('unavailable');
      failNotice(
        'Live microphone needs the Chrome or Edge Web Speech API. You can type the symptoms below instead.'
      );
      return;
    }

    if (wantsToListenRef.current) {
      // A deliberate stop: this is the only path that ends listening for good.
      wantsToListenRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      stopLevelMeter();
      setHeardSpeech(false);
      setInterimTranscript('');
      setIsRecording(false);
      setMic('idle');
      try {
        recognitionRef.current.stop();
      } catch {
        /* not running */
      }
      return;
    }

    wantsToListenRef.current = true;
    consecutiveFailuresRef.current = 0;
    setHeardSpeech(false);
    setInterimTranscript('');
    setMic('starting');
    void startLevelMeter();
    try {
      recognitionRef.current.start();
    } catch (err) {
      // A start() that throws means the recogniser is already running or the
      // service refused it. Say so rather than leaving a dead-looking button.
      setMic('error');
      failNotice('Could not start the microphone. Tap Live Mic to retry, or type the symptoms below.');
      console.warn('Failed to start microphone:', err);
    }
  };

  // Tell the rest of the console when the mic is live, so the dock can show it
  // even when this panel is scrolled out of view.
  useEffect(() => {
    onMicStateChange?.(micState);
  }, [micState, onMicStateChange]);

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
            /* Had no accessible name at all: a screen reader announced an
               unlabelled button for the product's primary control. */
            aria-label={micActive ? 'Stop listening' : 'Start listening'}
            aria-pressed={micActive}
            data-testid="mic-toggle"
            className={`btn-tactile px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
              micActive
                ? 'bg-rose-600 text-white shadow-rose-600/30'
                : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-slate-300'
            }`}
          >
            {/* REAL input level from the capture stream. The old dot pulsed on a
                timer, so a dead microphone looked exactly like a live one. */}
            {micActive ? (
              <span className="flex items-end gap-[2px] h-3" aria-hidden="true">
                {[0.45, 0.8, 1].map((f, i) => (
                  <span
                    key={i}
                    className="w-[3px] rounded-sm bg-white/90"
                    style={{
                      height: `${Math.max(
                        3,
                        Math.min(12, micLevel * 13 * f * (0.75 + 0.25 * Math.sin(Date.now() / 150 + i)))
                      )}px`,
                    }}
                  />
                ))}
              </span>
            ) : (
              <div className="w-2 h-2 rounded-full bg-rose-500" />
            )}
            {micActive ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-rose-600" />}
            <span>{micLabel}</span>
          </motion.button>
        </div>
      </div>

      {/*
        Privacy disclosure, placed directly under the control that captures audio.

        This is not decoration. The Web Speech API transcribes in Google's cloud,
        and the AI coach sends the transcript to a separate gateway. On a system
        that handles calls about self-harm, pregnancy and abuse, that is two
        third parties receiving the caller's words — and until now nothing on
        screen said so, while the product was marketed as local-first and
        zero-network-hop. The triage decision is made on-device; the transcription
        is not. Both halves of that sentence are now visible.
      */}
      <div className="px-4 sm:px-6 py-2 bg-slate-100/80 dark:bg-slate-900/60 border-b border-slate-200/70 dark:border-slate-800/70 text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
        <Info className="w-3 h-3 mt-px shrink-0" />
        <span>
          Triage decisions are made on this device. Microphone audio is transcribed by
          your browser using Google&rsquo;s speech service, and the transcript is sent to the
          AI coach gateway. Type below to keep the text on this device.
        </span>
      </div>

      {/* Active Recording Banner */}
      <AnimatePresence>
        {micActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 py-2.5 bg-rose-600 text-white text-xs font-medium flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>
                {micState === 'starting'
                  ? 'Starting microphone...'
                  : heardSpeech
                    ? awaitingAnswerFor
                      ? 'Listening — answer the question aloud, or tap'
                      : 'Listening — go ahead'
                    : awaitingAnswerFor
                      ? 'Listening — answer aloud, or tap an option'
                      : 'Listening — speak any emergency in English'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              {/* Live partial transcript: the operator sees what is being heard
                  now, instead of nothing until 650ms after they stop. */}
              <p className="pl-4 font-mono text-[11px] text-rose-50 italic truncate min-w-0">
                {interimTranscript ? `\u201C${interimTranscript}\u201D` : ''}
              </p>
              <button
                onClick={toggleMic}
                className="text-white/80 hover:text-white text-xs font-bold underline cursor-pointer shrink-0"
              >
                Stop
              </button>
            </div>
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

      {/*
        The primary action, moved to the top of the panel.

        It used to sit at the BOTTOM of a ~660px column, which put the symptom
        field at y=1116 on a 1440x1000 laptop — the main interaction of an
        emergency console was below the fold, and the first life-saving action
        on a matched call was further down still. Nothing above it earns that
        space: the waveform and transcript are output, not input.
      */}
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

      </div>
    </div>
  );
};
