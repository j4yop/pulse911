import { EmergencyProtocol } from '../types';

/**
 * Async AI dispatcher coaching via the HiDevs LLM gateway (llm.hidevs.xyz).
 *
 * ARCHITECTURAL CONTRACT — read before touching:
 * This module is deliberately OUT of the zero-latency critical path. The
 * sub-10ms Moss retrieval + template voice line always speak first; this
 * enrichment arrives ~1-3s later and is always labeled with its measured
 * round-trip time. It must never block, replace, or delay the template
 * protocol output.
 *
 * Every latency value produced here is a real performance.now() delta.
 * Nothing in this file fabricates numbers.
 */

export interface LlmCoaching {
  /** AI-generated coaching for the call handler, grounded in the resolved protocol. */
  text: string;
  /** Real measured gateway round-trip in ms (performance.now delta). */
  latencyMs: number;
  /** Model id as reported by the gateway response. */
  model: string;
}

export type LlmCoachingStatus = 'unconfigured' | 'loading' | 'ready' | 'error';

const GATEWAY_URL = import.meta.env.VITE_HIDEVS_LLM_URL as string | undefined;
const GATEWAY_KEY = import.meta.env.VITE_HIDEVS_LLM_KEY as string | undefined;
const GATEWAY_MODEL = (import.meta.env.VITE_HIDEVS_LLM_MODEL as string | undefined) ?? 'gemini-3.5-flash-lite';

/** Hard ceiling for the enrichment call — after this we surface an honest error, not a fake result. */
const REQUEST_TIMEOUT_MS = 6000;

export function isLlmConfigured(): boolean {
  return Boolean(GATEWAY_URL && GATEWAY_KEY);
}

export interface DispatcherPrompt {
  system: string;
  user: string;
}

/**
 * Pure prompt builder — exported for unit tests.
 * Grounds the model in the ALREADY-RESOLVED protocol so the LLM can never
 * reroute triage; it only coaches delivery. Instructs brevity because this
 * text is consumed mid-call by a stressed human.
 */
export function buildDispatcherPrompt(
  transcript: string,
  protocol: Pick<EmergencyProtocol, 'code' | 'title' | 'triageLevel' | 'verbalResponseText'>,
): DispatcherPrompt {
  const system = [
    'You are the dispatcher coach inside Pulse911, an emergency-call copilot.',
    'A deterministic retrieval engine has already resolved the protocol and the voice agent is already speaking the scripted instruction to the caller.',
    'Your job is ONLY to coach the human call handler: keep the caller calm, tell the handler what to verify next, and flag anything in the transcript that needs attention.',
    'Rules: stay strictly consistent with the given protocol; add no new clinical actions, no dosages, no diagnosis; never contradict the scripted instruction; no markdown, no headings, no lists; maximum 60 words; plain sentences only.',
  ].join(' ');

  const user = [
    `PROTOCOL RESOLVED: ${protocol.code} — ${protocol.title} (${protocol.triageLevel})`,
    `SCRIPTED INSTRUCTION ALREADY PLAYING TO CALLER: "${protocol.verbalResponseText}"`,
    `LIVE CALLER TRANSCRIPT: "${transcript.slice(0, 600)}"`,
    'Coach the handler now.',
  ].join('\n');

  return { system, user };
}

interface ChatCompletionPayload {
  choices?: Array<{ message?: { content?: unknown } }>;
}

/**
 * Pure response-shape extractor — exported for unit tests.
 * Validates the OpenAI-compatible chat-completion payload and returns the
 * trimmed content, or throws a typed error. Never guesses.
 */
export function extractCoachingText(payload: unknown): string {
  const maybe = payload as ChatCompletionPayload | null;
  if (maybe && Array.isArray(maybe.choices) && maybe.choices.length > 0) {
    const content = maybe.choices[0].message?.content;
    if (typeof content === 'string' && content.trim().length > 0) {
      return content.trim();
    }
  }
  throw new LlmResponseError('Gateway returned an unexpected response shape.');
}

export class LlmResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LlmResponseError';
  }
}

/**
 * Executes the enrichment call. Throws on timeout, HTTP error, or malformed
 * payload — the caller renders an honest "unavailable" state on any throw.
 */
export async function generateDispatcherCoaching(
  transcript: string,
  protocol: Pick<EmergencyProtocol, 'code' | 'title' | 'triageLevel' | 'verbalResponseText'>,
  signal?: AbortSignal,
): Promise<LlmCoaching> {
  if (!isLlmConfigured()) {
    throw new LlmResponseError('HiDevs gateway not configured (VITE_HIDEVS_LLM_URL / VITE_HIDEVS_LLM_KEY missing).');
  }

  const { system, user } = buildDispatcherPrompt(transcript, protocol);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const onExternalAbort = () => controller.abort();
  signal?.addEventListener('abort', onExternalAbort);

  const t0 = performance.now();
  try {
    const res = await fetch(GATEWAY_URL as string, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GATEWAY_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GATEWAY_MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        max_tokens: 300,
        temperature: 0.2,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new LlmResponseError(`Gateway HTTP ${res.status} after ${(performance.now() - t0).toFixed(0)}ms.`);
    }

    const payload: unknown = await res.json();
    const text = extractCoachingText(payload);
    return {
      text,
      latencyMs: performance.now() - t0,
      model: GATEWAY_MODEL,
    };
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', onExternalAbort);
  }
}
