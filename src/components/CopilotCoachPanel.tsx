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
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-2 text-[11px] font-mono text-slate-500">
        <Sparkles className="w-3.5 h-3.5 text-slate-400" />
        AI coach standby &bull; Gateway enrichment inactive.
      </div>
    );
  }

  if (state.status === 'loading') {
    return (
      <div className="bg-indigo-50/50 border border-indigo-200/70 rounded-xl p-3 flex items-center gap-2 text-[11px] font-mono text-indigo-700">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
        AI dispatcher coach generating (async background thread &bull; critical path unblocked)…
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-[11px] font-mono text-amber-800">
        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" />
        <span>
          AI coach notice: {state.message} Clinical protocol and live speech engine continue uninterrupted.
        </span>
      </div>
    );
  }

  const { coaching } = state;
  return (
    <div className="bg-indigo-50/40 border border-indigo-200/80 rounded-xl p-3.5 space-y-2 shadow-2xs">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5 font-mono uppercase tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          AI Dispatcher Copilot Coach
        </span>
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded border text-indigo-700 bg-white border-indigo-200 shadow-2xs flex items-center gap-1"
          title={`Model: ${coaching.model}`}
        >
          <Zap className="w-3 h-3 text-indigo-600" />
          {coaching.latencyMs.toFixed(0)} ms &bull; measured
        </span>
      </div>
      <p className="text-xs text-slate-800 leading-relaxed font-mono bg-white p-2.5 rounded-lg border border-indigo-100 shadow-2xs">
        {coaching.text}
      </p>
      <p className="text-[10px] font-mono text-slate-400">
        Grounded in resolved protocol {protocol?.code} &bull; Deterministic triage cannot be altered; LLM strictly coaches communication cadence.
      </p>
    </div>
  );
};
