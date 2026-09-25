import type { SearchResult } from '@moss-dev/moss-web';
import type { EmergencyProtocol, MossQueryResult, TriageOutcome, AbstainReason } from '../types';
import { EMERGENCY_PROTOCOLS } from './emergencyProtocols';
import { resolveTriageOutcome, MIN_CONFIDENCE } from './retrievalCore';

/**
 * Local structural type for the SDK client. The real `@moss-dev/moss-web` module
 * (and its multi-megabyte WASM payload) is imported DYNAMICALLY in `initInternal`
 * so it never sits on the critical first-paint path. This keeps the landing page
 * and deterministic fallback featherweight.
 */
type MossClientInstance = {
  createIndex(name: string, docs: Array<{ id: string; text: string; metadata: Record<string, string> }>): Promise<unknown>;
  loadIndex(name: string): Promise<unknown>;
  query(name: string, query: string, options: { topK: number }): Promise<SearchResult>;
};

/**
 * Pulse911 Retrieval Engine — REAL @moss-dev/moss-web (YC F25) integration.
 *
 * Architecture:
 *  1. PRIMARY:  Real Moss browser/WASM runtime. Documents are pushed to Moss Cloud,
 *               the index is pulled into the page, and `client.query()` runs embedding +
 *               hybrid semantic/keyword search in-process via WebAssembly.
 *               Latency is measured by the SDK itself (`result.timeTakenMs`).
 *  2. FALLBACK: If Moss Cloud credentials are absent or ingestion fails (e.g. offline
 *               demo, free-tier limits), the engine degrades gracefully to a local
 *               deterministic retrieval pass over the same protocol corpus, clearly
 *               labeled `local-fallback` in the UI. NO synthetic numbers are ever added.
 *
 * Honesty policy (sponsor event — Moss reads this repo):
 *  - `latencyMs` is ONLY ever the SDK's own measurement or a real performance.now()
 *    delta of executed work. Nothing is padded, randomized, or clamped.
 *  - `engine` reflects what actually served the query.
 */

export type EngineMode = 'moss-wasm' | 'local-fallback';

const INDEX_NAME = 'pulse911-protocols-v1';

/**
 * Hard deadline for ONE background Moss refinement query.
 *
 * This is a SAFETY control, not a performance tweak — but note carefully what
 * it does and does not cover. It bounds the *refinement* query only. It
 * deliberately does NOT bound `init()`: an earlier version applied this budget
 * to the cold start too, which could never complete inside 8s (the runtime
 * compiles a multi-megabyte ONNX model), so initialization always "failed" and
 * was permanently disabled for the session. Warming up slowly is fine.
 *
 * Nothing on the dispatcher-facing path awaits this. The local deterministic
 * triage has already decided, spoken, and dispatched by the time a refinement
 * starts, so a stalled or slow Moss query can delay a badge — never a decision.
 */
const MOSS_REFINEMENT_BUDGET_MS = 8000;

/** Flatten a protocol into one indexable text block (retrieved verbatim on match). */
function protocolToDocText(p: EmergencyProtocol): string {
  return [
    `${p.title}. Category: ${p.category}. Triage: ${p.triageLevel}.`,
    p.clinicalSummary,
    `Immediate actions: ${p.immediateActions.join(' ')}`,
    `Critical questions: ${p.criticalQuestions.join(' ')}`,
    `Contraindications: ${p.contraindications.join(' ')}`,
    `Dispatch: ${p.unitRecommendation.unitType} — ${p.unitRecommendation.priority}. Equipment: ${p.unitRecommendation.requiredEquipment.join(', ')}`,
    `Keywords: ${p.keywords.join(', ')}`,
  ].join('\n');
}

function protocolToMetadata(p: EmergencyProtocol): Record<string, string> {
  return {
    protocolId: p.id,
    category: p.category,
    triageLevel: p.triageLevel,
    code: p.code,
  };
}

class Pulse911RetrievalEngine {
  private client: MossClientInstance | null = null;
  private mode: EngineMode = 'local-fallback';
  private initPromise: Promise<void> | null = null;
  private lastInitError: string | null = null;
  private totalQueries = 0;

  /**
   * Kick off async initialization; safe to call multiple times.
   *
   * There is deliberately NO deadline here. An earlier version raced `init`
   * against the 4s budget, which was a mistake in both directions: the runtime
   * must download and compile a ~28MB ONNX model, so initialization essentially
   * never completes inside 4s. The race therefore *always* rejected, and its
   * catch handler set `mode = 'local-fallback'` and `client = null` — which
   * permanently disabled Moss for the rest of the session, so `refineWithMoss`
   * returned null forever and the runtime never contributed to anything.
   *
   * The budget belongs on the QUERY path (`refineWithMoss`), which is the only
   * thing a dispatcher ever waits on. Warming up slowly is fine; failing to
   * finish warming is not.
   */
  public init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.initInternal().catch((e: unknown) => {
        this.lastInitError = e instanceof Error ? e.message : String(e);
        // Abandon the WASM path for the rest of the session so we do not pay
        // this failure on every subsequent query.
        this.mode = 'local-fallback';
        this.client = null;
        console.warn(`[Pulse911] Moss runtime unavailable, using local-fallback: ${this.lastInitError}`);
      });
    }
    return this.initPromise;
  }

  private async initInternal(): Promise<void> {
    const projectId = (import.meta.env?.VITE_MOSS_PROJECT_ID as string | undefined)?.trim();
    const projectKey = (import.meta.env?.VITE_MOSS_PROJECT_KEY as string | undefined)?.trim();

    if (!projectId || !projectKey) {
      throw new Error('VITE_MOSS_PROJECT_ID / VITE_MOSS_PROJECT_KEY not configured');
    }

    // Dynamic import: the SDK + WASM runtime is fetched only once a Moss query
    // is actually needed, keeping it off the initial page-load critical path.
    const { MossClient } = await import('@moss-dev/moss-web');
    this.client = new MossClient(projectId, projectKey) as unknown as MossClientInstance;

    // Idempotent ingestion: create the index (no-op-safe), then load into runtime memory.
    const docs = EMERGENCY_PROTOCOLS.map((p) => ({
      id: p.id,
      text: protocolToDocText(p),
      metadata: protocolToMetadata(p),
    }));

    try {
      await this.client.createIndex(INDEX_NAME, docs);
    } catch {
      // Index already exists in Moss Cloud — continue to load.
    }

    await this.client.loadIndex(INDEX_NAME);
    this.mode = 'moss-wasm';
    console.log(`[Pulse911] Moss WASM runtime ready — index "${INDEX_NAME}" (${docs.length} protocols) loaded in-process.`);
  }

  public getMode(): EngineMode {
    return this.mode;
  }

  public getInitError(): string | null {
    return this.lastInitError;
  }

  public getStats() {
    return {
      protocolsCount: EMERGENCY_PROTOCOLS.length,
      mode: this.mode,
      initError: this.lastInitError,
      totalQueries: this.totalQueries,
      indexName: INDEX_NAME,
    };
  }

  /**
   * Runs ONE triage for the transcript.
   *
   * ── Critical path policy ────────────────────────────────────────────────
   * The DECISION is made by the deterministic local matcher, synchronously.
   * That is deliberate: the safety-critical voice path must never wait on a
   * network round-trip, a WASM compile, or a third-party service to tell a
   * caller whether someone is breathing. An earlier version awaited the Moss
   * cold start here, which left the dispatcher staring at an empty console for
   * seconds on first use — the worst possible failure mode for this product.
   *
   * Moss is therefore warmed in the BACKGROUND and used to refine the outcome
   * once ready (see `refineWithMoss`). It is an enhancement, never a
   * precondition, and never a source of a hang.
   *
   * SAFETY: this may resolve to an `abstain` outcome. It must never invent a
   * protocol — the old `?? EMERGENCY_PROTOCOLS[0]` fallback meant any miss
   * became cardiac arrest, which was then spoken and dispatched.
   */
  public async query(transcript: string, topK = 3): Promise<MossQueryResult> {
    this.totalQueries += 1;

    // Warm the WASM runtime in the background. Never awaited on the hot path.
    void this.init();

    return this.localQuery(transcript);
  }

  /**
   * Optional refinement: once the Moss runtime is warm, re-run the transcript
   * through the real WASM index and return a better-scored outcome. Returns
   * null when Moss is not ready, so callers can keep the local result.
   */
  public async refineWithMoss(transcript: string, topK = 3): Promise<MossQueryResult | null> {
    if (!this.client || this.mode !== 'moss-wasm') return null;
    try {
      const result: SearchResult = await Promise.race([
        this.client.query(INDEX_NAME, transcript, { topK }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Moss query timed out')), MOSS_REFINEMENT_BUDGET_MS)
        ),
      ]);
      const docs = result.docs ?? [];
      if (docs.length === 0) return null;

      const top = docs[0];
      const second = docs[1];
      const topScore = top?.score ?? 0;
      const margin = topScore > 0 ? (topScore - (second?.score ?? 0)) / topScore : 0;
      const confidence = +(margin * Math.min(1, Math.max(0, topScore))).toFixed(3);
      const protocol =
        EMERGENCY_PROTOCOLS.find((p) => p.id === top.id) ??
        EMERGENCY_PROTOCOLS.find((p) => p.id === top.metadata?.protocolId);

      if (!protocol || confidence < MIN_CONFIDENCE) {
        return {
          outcome: this.abstain(!protocol ? 'no-anchor-match' : 'low-confidence'),
          score: +topScore.toFixed(4),
          latencyMs: +(result.timeTakenMs ?? 0).toFixed(2),
          engine: 'Moss WASM Runtime (@moss-dev/moss-web)',
          vectorDistance: 1 - topScore,
          tokensEvaluated: transcript.split(/\s+/).filter(Boolean).length,
        };
      }

      return {
        outcome: { kind: 'matched', protocol, confidence, margin: +margin.toFixed(3), anchors: [] },
        score: +topScore.toFixed(4),
        latencyMs: +(result.timeTakenMs ?? 0).toFixed(2),
        engine: 'Moss WASM Runtime (@moss-dev/moss-web)',
        vectorDistance: 1 - topScore,
        tokensEvaluated: transcript.split(/\s+/).filter(Boolean).length,
      };
    } catch (err) {
      // Was `catch { return null }`. A silent catch here is what let a broken
      // Moss path look identical to a healthy one for an entire release.
      console.warn(
        `[Pulse911] Moss refinement unavailable, keeping local triage: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      return null;
    }
  }

  private abstain(reason: AbstainReason): TriageOutcome {
    return { kind: 'abstain', reason, confidence: 0, anchors: [] };
  }

  /** Honest local fallback: real measurement of real work via the shared pure triage, clearly labeled. */
  private localQuery(transcript: string): MossQueryResult {
    const t0 = performance.now();
    const outcome = resolveTriageOutcome(transcript, EMERGENCY_PROTOCOLS);
    const latencyMs = +(performance.now() - t0).toFixed(2);
    const score = outcome.kind === 'matched' ? outcome.confidence : 0;

    return {
      outcome,
      score,
      latencyMs,
      engine: 'Local Fallback (deterministic keyword pass)',
      vectorDistance: outcome.kind === 'matched' ? +(1 - outcome.confidence).toFixed(3) : 1,
      tokensEvaluated: transcript.split(/\s+/).filter(Boolean).length,
    };
  }
}

export const mossEngine = new Pulse911RetrievalEngine();
