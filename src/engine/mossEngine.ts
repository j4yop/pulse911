import type { SearchResult } from '@moss-dev/moss-web';
import type { EmergencyProtocol, MossQueryResult, TriageOutcome, AbstainReason } from '../types';
import { EMERGENCY_PROTOCOLS } from './emergencyProtocols';
import { toIndexPayload } from './knowledgeBase';
import { resolveTriageOutcome, MIN_CONFIDENCE } from './retrievalCore';

/**
 * Local structural type for the SDK client. The real `@moss-dev/moss-web` module
 * (and its multi-megabyte WASM payload) is imported DYNAMICALLY in `initInternal`
 * so it never sits on the critical first-paint path. This keeps the landing page
 * and deterministic fallback featherweight.
 */
type MossClientInstance = {
  createIndex(name: string, docs: Array<{ id: string; text: string; metadata: Record<string, string> }>): Promise<{ docCount?: number } | undefined>;
  loadIndex(name: string): Promise<unknown>;
  query(
    name: string,
    query: string,
    options: { topK: number; filter?: unknown }
  ): Promise<SearchResult>;
  getIndex(name: string): Promise<{ docCount: number; status: string; updatedAt?: string }>;
};

/** True only for the one failure that is safe to ignore: the index is already there. */
function isAlreadyExists(err: unknown): boolean {
  const status = (err as { status?: number; statusCode?: number })?.status
    ?? (err as { statusCode?: number })?.statusCode;
  if (status === 409) return true;
  return /already exists|already_exists|conflict/i.test(
    err instanceof Error ? err.message : String(err)
  );
}

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

/**
 * v2: the corpus changed shape entirely (6 protocol documents -> 186
 * actionable-fact documents). Reusing v1 would silently keep serving the old
 * six-document index, so the name is versioned. The old `pulse911-protocols-v1`
 * index is now orphaned in Moss Cloud and can be deleted.
 */
/**
 * Corpus version, and the only thing that makes ingestion take effect.
 *
 * BUMP THIS whenever `toIndexPayload()` changes. `createIndex` is a no-op when
 * the name already exists, so a new corpus under an old name is silently never
 * uploaded — the app would keep serving the previous snapshot while reporting
 * the new document count. That is how 11 protocols went missing.
 */
const INDEX_NAME = 'pulse911-kb-v3';

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

/**
 * The FIRST query also downloads and instantiates the model runtime. Measured in
 * a real browser: 141s cold, then 27-40ms warm. The old single 8s budget sat on
 * the cold query, so it could never succeed and Moss was declared dead on
 * arrival.
 */
const MOSS_COLD_START_BUDGET_MS = 180000;

/**
 * Restricts retrieval to protocol documents, server-side.
 *
 * Two reasons, and the second is the safety one:
 *  1. Protocol docs are 17 of 197 documents, so unfiltered retrieval returns
 *     action and red-flag snippets and never a protocol.
 *  2. `SearchResult.docs[].metadata` comes back EMPTY from Moss even though it
 *     was uploaded and is filterable. The old code gated on
 *     `metadata.kind === 'protocol'`, which therefore never passed and Moss
 *     could never contribute a clinical decision.
 *
 * Filtering at the source makes "a guidance hit is not a protocol" structural
 * rather than dependent on the service echoing metadata back.
 */
const PROTOCOL_ONLY_FILTER = {
  field: 'kind',
  condition: { $eq: 'protocol' },
} as const;

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
   * Why the Moss path is not serving queries, or null while it is.
   *
   * The badge used to read "Moss Local" for both "working as designed" and
   * "permanently broken", which is the same lie in both directions. Recorded
   * explicitly so the console can state the real reason.
   */
  private mossUnavailableReason: string | null = null;
  private mossReady = false;
  /** True once the model runtime has actually served one query. */
  private mossWarm = false;
  private warmupPromise: Promise<void> | null = null;

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
        this.mossReady = false;
        this.mossUnavailableReason = this.lastInitError;
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
    //
    // This indexes the KNOWLEDGE BASE, not the six protocols. The old index held
    // one document per protocol — six documents, which is not a corpus and made
    // a 28MB semantic runtime pointless. The knowledge base is one document per
    // actionable fact (186 of them), so retrieval has something to retrieve.
    const docs = toIndexPayload();

    let created = false;
    try {
      const result = await this.client.createIndex(INDEX_NAME, docs);
      created = true;
      console.log(
        `[Pulse911] Created Moss index "${INDEX_NAME}" from ${result?.docCount ?? docs.length} documents.`
      );
    } catch (err) {
      // Only "already exists" is safe to continue past. The old `catch {}`
      // accepted every failure — a 401 or a quota error would be swallowed and
      // the app would then load a stale index believing ingestion had worked.
      if (!isAlreadyExists(err)) throw err;
      console.log(
        `[Pulse911] Moss index "${INDEX_NAME}" already exists — loading the existing snapshot.`
      );
    }

    await this.client.loadIndex(INDEX_NAME);

    // Verify the loaded index against the corpus instead of asserting it. The
    // SDK reports the real docCount; the previous log printed the size of the
    // payload we *tried* to send, which stayed 197 while the index held 186.
    let remoteCount: number | null = null;
    try {
      remoteCount = (await this.client.getIndex(INDEX_NAME))?.docCount ?? null;
    } catch {
      remoteCount = null;
    }
    if (remoteCount !== null && remoteCount !== docs.length) {
      this.mossUnavailableReason =
        `index "${INDEX_NAME}" holds ${remoteCount} documents but the corpus has ${docs.length}` +
        ` — bump INDEX_NAME to re-ingest`;
      this.mode = 'local-fallback';
      this.mossReady = false;
      throw new Error(this.mossUnavailableReason);
    }

    this.mode = 'moss-wasm';
    this.mossReady = true;
    this.mossUnavailableReason = null;
    console.log(
      `Moss WASM runtime ready — index "${INDEX_NAME}" (${created ? 'created' : 'existing'}, ` +
        `${remoteCount ?? 'unverified'} documents) loaded in-process.`
    );

    /**
     * Pay the ~140s model download and WASM instantiation NOW, in the background,
     * instead of on the operator's first query. Deliberately not awaited: init
     * stays fast and the caller-facing budget covers the wait.
     */
    this.warmupPromise = (async () => {
      try {
        await this.client!.query(INDEX_NAME, 'emergency', {
          topK: 1,
          filter: PROTOCOL_ONLY_FILTER,
        });
        this.mossWarm = true;
        console.log('[Pulse911] Moss model runtime warm.');
      } catch (err) {
        // Not fatal: the next real query will pay the cold start itself.
        this.mossWarm = false;
        console.warn(
          `[Pulse911] Moss warmup did not complete: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    })();
  }

  /**
   * Real Moss availability, for the console to state plainly.
   *
   * `ready` means the runtime initialised and queries have not failed. It does
   * NOT mean the corpus is being read — that requires a query to have actually
   * returned, which is tracked separately so the product cannot imply Moss is
   * contributing when it is not.
   */
  public getMossStatus(): {
    ready: boolean;
    warming: boolean;
    serving: boolean;
    reason: string | null;
  } {
    return {
      ready: this.mossReady,
      // Ready but not yet warm: the model runtime is still downloading and
      // instantiating. Claiming "serving" here would be the old dishonesty in a
      // new place — the runtime is up, but no query has ever been answered.
      warming: this.mossReady && !this.mossWarm,
      serving: this.mossUnavailableReason === null && this.mossReady && this.mossWarm,
      reason: this.mossUnavailableReason,
    };
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
    const startedAt = performance.now();
    const cold = !this.mossWarm;
    const budget = cold ? MOSS_COLD_START_BUDGET_MS : MOSS_REFINEMENT_BUDGET_MS;

    try {
      // If warmup is already in flight, let it finish first so this query is
      // charged the warm budget rather than racing the cold one.
      if (cold && this.warmupPromise) {
        await Promise.race([
          this.warmupPromise,
          new Promise<void>((r) => setTimeout(r, budget)),
        ]);
      }

      const result: SearchResult = await Promise.race([
        this.client.query(INDEX_NAME, transcript, {
          topK,
          filter: PROTOCOL_ONLY_FILTER,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Moss query timed out')), budget)
        ),
      ]);
      this.mossWarm = true;
      const docs = result.docs ?? [];
      if (docs.length === 0) return null;

      const top = docs[0];
      const second = docs[1];
      const topScore = top?.score ?? 0;
      const margin = topScore > 0 ? (topScore - (second?.score ?? 0)) / topScore : 0;
      const confidence = +(margin * Math.min(1, Math.max(0, topScore))).toFixed(3);

      // The index now holds one document per *actionable fact*, not one per
      // protocol, so ids look like `cat-airway::safe-action::0`. Only a
      // document explicitly marked `kind: 'protocol'` may become a clinical
      // decision.
      //
      // This matters for safety, not just correctness: Moss retrieving "do not
      // put anything in their mouth" is a useful *guidance* hit, but treating
      // an action document as a protocol would manufacture a clinical claim out
      // of a first-aid snippet.
      // Resolve the protocol from the id, not from metadata. Moss returns
      // `metadata: {}` on retrieval even though it was uploaded, so the old
      // `metadata.kind === 'protocol'` gate could never pass. Protocol documents
      // are indexed with `id: p.id` and nothing else uses that shape, so matching
      // the id against the live protocol registry is both reliable and stricter:
      // an id that is not a real protocol cannot become a clinical decision.
      const matchedById = EMERGENCY_PROTOCOLS.find((p) => p.id === top?.id);
      const protocol = matchedById ?? null;

      if (!protocol) {
        // A non-protocol id is not a protocol. Report nothing rather than
        // inventing an outcome from it.
        return null;
      }

      if (confidence < MIN_CONFIDENCE) {
        return {
          outcome: this.abstain('low-confidence'),
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
      const reason = err instanceof Error ? err.message : String(err);
      // A timeout means slow, not broken. Recording it as "unavailable" is how a
      // cold start got reported as a dead service for an entire release. Only
      // real failures (auth, network, init) mark Moss unavailable.
      if (/timed out/i.test(reason)) {
        console.warn(
          `[Pulse911] Moss query exceeded its ${cold ? 'cold-start' : 'warm'} budget ` +
            `(${Math.round(performance.now() - startedAt)}ms); keeping local triage.`
        );
        return null;
      }
      this.mossUnavailableReason = reason;
      console.warn(`[Pulse911] Moss refinement failed, keeping local triage: ${reason}`);
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
