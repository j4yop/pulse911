import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Loader2, AlertTriangle, Zap } from 'lucide-react';
import { EmergencyProtocol } from '../types';
import {
  LlmCoaching,
  LlmResponseError,
  generateDispatcherCoaching,
  isLlmConfigured,
} from '../engine/copilotLlm';

interface CopilotCoachPanelProps {
  transcript: string;
  protocol: EmergencyProtocol | null;
  /** Changes whenever a new call/protocol is resolved — cancels in-flight enrichment from the previous call. */
  requestId: number;
}

type PanelState =
  | { status: 'unconfigured' }
  | { status: 'loading' }
  | { status: 'ready'; coaching: LlmCoaching }
  | { status: 'error'; message: string };

/**
 * AI Dispatcher Coach — async enrichment layer.
 *
 * Rendered AFTER the instant protocol card. The sub-10ms retrieval + scripted
 * voice line never wait for this panel; it fills in ~1-3s later, always
 * labeled with its real measured gateway latency.
 */
export const CopilotCoachPanel: React.FC<CopilotCoachPanelProps> = ({ transcript, protocol, requestId }) => {
  const [state, setState] = useState<PanelState>({ status: 'unconfigured' });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // New call or no protocol → cancel in-flight work and reset.
    abortRef.current?.abort();
    if (!protocol || !isLlmConfigured()) {
      setState(isLlmConfigured() ? { status: 'loading' } : { status: 'unconfigured' });
      return;
    }

    setState({ status: 'loading' });
    const controller = new AbortController();
    abortRef.current = controller;

    generateDispatcherCoaching(transcript, protocol, controller.signal)
      .then((coaching) => {
        if (!controller.signal.aborted) setState({ status: 'ready', coaching });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message =
          err instanceof LlmResponseError
            ? err.message
            : 'Gateway unreachable (network error or timeout).';
        setState({ status: 'error', message });
      });

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  if (state.status === 'unconfigured') {
    return (
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center gap-2 text-[11px] font-mono text-slate-500">
        <Sparkles className="w-3.5 h-3.5" />
        AI coach inactive — HiDevs gateway key not configured.
      </div>
    );
  }

  if (state.status === 'loading') {
    return (
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center gap-2 text-[11px] font-mono text-slate-400">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
        AI dispatcher coach generating (async — never in the critical path)…
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2 text-[11px] font-mono text-amber-300">
        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>
          AI coach unavailable: {state.message} Protocol and voice line continue uninterrupted — by design.
        </span>
      </div>
    );
  }

  const { coaching } = state;
  return (
    <div className="bg-indigo-500/5 border border-indigo-500/25 rounded-xl p-3.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5 font-mono uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          AI Dispatcher Coach
        </span>
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded border text-indigo-300 bg-slate-800/60 border-indigo-500/30 flex items-center gap-1"
          title={`Model: ${coaching.model}`}
        >
          <Zap className="w-3 h-3 text-indigo-400" />
          {coaching.latencyMs.toFixed(0)} ms · measured
        </span>
      </div>
      <p className="text-xs text-slate-200 leading-relaxed font-mono bg-slate-950/60 p-2.5 rounded-lg border border-indigo-500/15">
        {coaching.text}
      </p>
      <p className="text-[10px] font-mono text-slate-500">
        Grounded in resolved protocol {protocol?.code} — the LLM cannot reroute triage; it only coaches delivery.
      </p>
    </div>
  );
};
