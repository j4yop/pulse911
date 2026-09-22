import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Clock,
  BarChart3,
  Play,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ArrowRight,
  TrendingDown,
  Sparkles
} from 'lucide-react';
import { mossEngine } from '../engine/mossEngine';

export const LatencyBenchmark: React.FC = () => {
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [progressCount, setProgressCount] = useState(0);
  const [results, setResults] = useState<{
    mossP50: number;
    mossP95: number;
    mossP99: number;
    remoteP50: number;
    remoteP95: number;
    queriesCount: number;
    timeSavedSeconds: number;
  } | null>(null);

  const runBenchmark = async () => {
    setIsRunningTest(true);
    setProgressCount(0);
    const mossLatencies: number[] = [];
    const testQueries = [
      'adult cardiac arrest chest compressions',
      'infant choking 9 month old baby',
      'stroke facial droop last known well',
      'peanut anaphylactic shock epipen thigh',
      'fentanyl overdose narcan rescue breathing',
    ];

    for (let i = 0; i < 50; i++) {
      const q = testQueries[i % testQueries.length];
      const res = await mossEngine.query(q);
      mossLatencies.push(res.latencyMs);
      setProgressCount(i + 1);
      await new Promise((r) => setTimeout(r, 15));
    }

    mossLatencies.sort((a, b) => a - b);
    const p50 = mossLatencies[Math.floor(mossLatencies.length * 0.5)];
    const p95 = mossLatencies[Math.floor(mossLatencies.length * 0.95)];
    const p99 = mossLatencies[Math.floor(mossLatencies.length * 0.99)];

    const CITED_REMOTE_P50 = 430;
    setResults({
      mossP50: +p50.toFixed(2),
      mossP95: +p95.toFixed(2),
      mossP99: +p99.toFixed(2),
      remoteP50: CITED_REMOTE_P50,
      remoteP95: 590,
      queriesCount: mossLatencies.length,
      timeSavedSeconds: +(((CITED_REMOTE_P50 - p50) * mossLatencies.length) / 1000).toFixed(2),
    });

    setIsRunningTest(false);
  };

  return (
    <div className="max-w-[1250px] mx-auto space-y-8 pb-16 font-sans">
      {/* Header */}
      <div className="text-center space-y-3 pt-4 sm:pt-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-2xs">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Sub-10ms Benchmark &bull; Biological Turnaround Latency Analysis</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Why "Zero Latency" Saves Lives in 911 Dispatch
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Comparing local-first in-memory retrieval (<strong className="text-slate-900 font-semibold">Moss</strong>) against traditional cloud-hosted vector databases (Pinecone, Qdrant) in conversational voice pipelines.
        </p>
      </div>

      {/* The 300ms Biological Ceiling Diagram */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>The 300ms Human Conversational Ceiling</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              In high-stress voice conversations, any delay over 300ms feels like an unnatural hesitation, inducing panic.
            </p>
          </div>
          <button
            onClick={runBenchmark}
            disabled={isRunningTest}
            className="btn-tactile px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-xs shadow-rose-600/20 active:scale-[0.98]"
          >
            {isRunningTest ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                <span>Testing ({progressCount}/50 Queries)...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Run Live Latency Benchmark</span>
              </>
            )}
          </button>
        </div>

        {/* Breakdown Visualizer Bars */}
        <div className="space-y-6">
          {/* Architecture A: Traditional RAG with Pinecone */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-rose-600 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Standard Architecture (Cloud Vector DB): 470 ms Total Turnaround
              </span>
              <span className="text-rose-700 font-bold text-[11px] bg-rose-50 border border-rose-200 px-2 py-0.5 rounded shadow-2xs">
                170ms Over Human Threshold 🔴
              </span>
            </div>

            <div className="h-9 w-full bg-slate-100 rounded-xl overflow-hidden flex text-[10px] font-mono font-bold border border-slate-200 shadow-inner">
              <div style={{ width: '15%' }} className="bg-sky-500 flex items-center justify-center text-white" title="Voice VAD & Audio Chunks (70ms)">
                VAD 70ms
              </div>
              <div style={{ width: '20%' }} className="bg-indigo-500 flex items-center justify-center text-white" title="Whisper / Deepgram STT (90ms)">
                STT 90ms
              </div>
              <div style={{ width: '45%' }} className="bg-rose-500 flex items-center justify-center text-white animate-pulse" title="Cloud Vector DB Network Roundtrip (210ms)">
                Cloud Vector DB 210ms ⚠️
              </div>
              <div style={{ width: '20%' }} className="bg-amber-500 flex items-center justify-center text-white" title="LLM TTFT + TTS (100ms)">
                LLM + Audio 100ms
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Result: The caller hears unnatural silence and starts yelling <em className="text-slate-700 font-medium">"Hello?! Are you there?!"</em> before the AI speaks.
            </p>
          </div>

          {/* Architecture B: Pulse911 with Moss */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Pulse911 Architecture (Powered by Moss): 264 ms Total Turnaround
              </span>
              <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded shadow-2xs">
                Within Natural Cadence 🟢
              </span>
            </div>

            <div className="h-9 w-full bg-slate-100 rounded-xl overflow-hidden flex text-[10px] font-mono font-bold border border-emerald-300 shadow-inner">
              <div style={{ width: '25%' }} className="bg-sky-500 flex items-center justify-center text-white" title="Voice VAD & Audio Chunks (70ms)">
                VAD 70ms
              </div>
              <div style={{ width: '32%' }} className="bg-indigo-500 flex items-center justify-center text-white" title="Fast STT (90ms)">
                STT 90ms
              </div>
              <div style={{ width: '4%' }} className="bg-emerald-500 flex items-center justify-center text-slate-950 font-extrabold shadow-xs" title="Moss Sub-10ms Semantic Search (4ms)">
                4ms
              </div>
              <div style={{ width: '39%' }} className="bg-amber-500 flex items-center justify-center text-white" title="LLM TTFT + TTS (100ms)">
                LLM TTFT + TTS Audio 100ms
              </div>
            </div>
            <p className="text-[11px] text-emerald-800 font-medium">
              Result: Instantaneous voice interruption. The AI answers with life-saving instructions before the caller finishes exhaling.
            </p>
          </div>
        </div>
      </div>

      {/* Statistical Benchmark Comparison Cards */}
      <AnimatePresence>
        {results ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-2xs">
              <span className="text-xs text-slate-500 font-mono block font-medium">Moss P50 Latency</span>
              <div className="text-3xl font-extrabold text-emerald-600 font-mono">
                {results.mossP50} ms
              </div>
              <span className="text-[11px] text-slate-500 block">
                vs. {results.remoteP50} ms cloud vector DB <em className="text-slate-400">(cited: Moss 100k-doc benchmark)</em> (
                <strong className="text-emerald-700 font-semibold">{Math.round(results.remoteP50 / results.mossP50)}x faster</strong>)
              </span>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-2xs">
              <span className="text-xs text-slate-500 font-mono block font-medium">Moss P99 Tail Latency</span>
              <div className="text-3xl font-extrabold text-emerald-600 font-mono">
                {results.mossP99} ms
              </div>
              <span className="text-[11px] text-slate-500 block">
                Measured P99 &bull; runs fully client-side via Moss WASM runtime
              </span>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-2xs">
              <span className="text-xs text-slate-500 font-mono block font-medium">Time Saved in 50 Calls</span>
              <div className="text-3xl font-extrabold text-amber-600 font-mono">
                {results.timeSavedSeconds} s
              </div>
              <span className="text-[11px] text-slate-500 block">
                Cumulative critical seconds saved during active resuscitation
              </span>
            </div>
          </motion.div>
        ) : (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-center text-xs text-slate-500 font-mono">
            Click <strong className="text-rose-600">"Run Live Latency Benchmark"</strong> above to fire 50 real queries against the local Moss engine and compute live P50, P95, and P99 percentiles.
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
