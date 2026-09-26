import type { EmergencyProtocol, TriageOutcome, AbstainReason } from '../types';

/**
 * Retrieval Core — pure, deterministic triage ranking.
 *
 * This module has zero I/O and zero SDK dependencies: given a transcript and the
 * protocol corpus it always produces the same outcome. It serves two purposes:
 *
 *  1. It IS the local-fallback triage used when the Moss WASM runtime is
 *     unavailable (offline demo, missing credentials) — real work, honestly
 *     measured by the caller, labeled `local-fallback` in the UI.
 *  2. It is directly unit-testable (vitest, node environment, no mocks),
 *     which is how we guarantee every demo scenario resolves its intended
 *     protocol BEFORE standing in front of judges.
 *
 * ── Safety model ────────────────────────────────────────────────────────────
 * The critical property is that this function is allowed to return NOTHING.
 *
 * The previous implementation always returned `ranked[0]`, breaking ties by
 * corpus order. Cardiac arrest is at index 0, so any presentation that matched
 * nothing (a woman in labour, a stroke, "my parcel never arrived", or an empty
 * transcript) resolved to cardiac arrest — and that protocol was then spoken
 * aloud and dispatched. That is the bug this rewrite exists to close.
 *
 * Scoring model (transparent, not neural):
 *  - Symptom phrase hits, weighted by phrase length (a 3-word phrase like
 *    "digital arrest" is a stronger signal than a 1-word hit).
 *  - Matching is word-boundary + light stemming, so "face drooping" reaches
 *    "facial droop" and "choking" reaches "choke". Plain `includes()` did neither.
 *  - Confidence is SCALE-FREE: a margin term (how far ahead the winner is)
 *    times a density term (how much real evidence fired). It does not shift
 *    when protocols are added to the corpus, so the threshold stays meaningful.
 */

/** Weight of a phrase hit grows with the number of words in the phrase. */
function phraseWeight(phrase: string): number {
  return phrase.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Cheap suffix folding so "choking"/"choke"/"choked" compare equal.
 *
 * Guard: never stem tokens of 4 characters or fewer. Without this, "aed"
 * stemmed to "a" and matched the article "a" in ordinary speech, and "is"
 * stemmed to "i" — which produced false clinical matches on unrelated input.
 * Over-stemming short words is far more dangerous than missing an inflection.
 */
function stem(word: string): string {
  const w = word.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (w.length <= 4) return w;
  return w.replace(/(ing|ed|es|s)$/i, '');
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(stem)
    .filter(Boolean);
}

/**
 * Order-independent containment: every stemmed token of `phrase` must appear
 * somewhere in the transcript.
 *
 * A consecutive-run match was tried first and is too brittle for real speech —
 * "his speech is slurred" does not contain the run [slurred, speech], so the
 * stroke protocol never fired on an actual stroke. Callers under stress reorder
 * words, drop articles and splice clauses, so presence is the right primitive.
 * Specificity is instead controlled by MIN_ANCHOR_WEIGHT: a one-word match
 * alone is never enough to select a protocol.
 */
function phrasePresent(haystackTokens: string[], phrase: string): boolean {
  const needle = tokenize(phrase);
  if (needle.length === 0) return false;
  if (needle.length > haystackTokens.length) return false;

  const seen = new Set(haystackTokens);
  return needle.every((t) => seen.has(t));
}

/** Evidence threshold: a single 1-word hit is never enough to act on. */
const MIN_ANCHOR_WEIGHT = 2;
/** Confidence below this abstains. Calibrated in calibration.json, not asserted. */
const MIN_CONFIDENCE = 0.34;

export interface ProtocolMatch {
  protocol: EmergencyProtocol;
  score: number;
  anchors: string[];
  corpusIndex: number;
}

/**
 * The minimum shape the ranker needs. Exists so the *same* scoring, stemming
 * and phrase-matching code serves both clinical protocols and the broad
 * guidance categories. Duplicating this matcher for a second corpus is how two
 * corpora quietly start disagreeing about what a sentence means.
 */
export interface Rankable {
  id: string;
  keywords: string[];
  clinicalSummary: string;
  /** Clinical protocols carry `title`; guidance categories carry `label`. */
  title?: string;
  label?: string;
}

export interface RankMatch<T extends Rankable> {
  item: T;
  score: number;
  anchors: string[];
  corpusIndex: number;
}

/** Rank any keyword corpus. Never fabricates a winner — callers decide. */
export function rankByText<T extends Rankable>(
  transcript: string,
  items: T[],
  topK = 3
): RankMatch<T>[] {
  const tokens = tokenize(transcript);

  const scored = items.map((p, corpusIndex) => {
    let score = 0;
    const anchors: string[] = [];

    // 1. Symptom phrase hits (the dominant, auditable signal).
    for (const kw of p.keywords) {
      if (phrasePresent(tokens, kw)) {
        score += phraseWeight(kw);
        anchors.push(kw);
      }
    }

    // 2. Weak lexical overlap on title/summary — a tiebreaker, kept small so
    //    real symptom anchors always dominate.
    const corpus = tokenize(`${p.title ?? p.label ?? ''} ${p.clinicalSummary}`);
    if (corpus.length > 0) {
      let overlap = 0;
      for (const tok of tokens) {
        if (corpus.includes(tok)) overlap += 1;
      }
      score += Math.min(overlap / corpus.length, 0.5);
    }

    return { item: p, score: +score.toFixed(3), anchors, corpusIndex };
  });

  // Sort by score desc. corpusIndex remains ONLY as a stable display order —
  // it is never used to break a tie into a winner (see resolveOutcome).
  scored.sort((a, b) => b.score - a.score || a.corpusIndex - b.corpusIndex);

  return scored.slice(0, Math.max(1, topK));
}

/** Ranks every protocol. Never fabricates a winner — callers decide. */
export function rankProtocols(
  transcript: string,
  protocols: EmergencyProtocol[],
  topK = 3
): ProtocolMatch[] {
  return rankByText(transcript, protocols, topK).map(({ item, ...rest }) => ({
    protocol: item,
    ...rest,
  }));
}

function abstain(reason: AbstainReason, anchors: string[] = []): TriageOutcome {
  return { kind: 'abstain', reason, confidence: 0, anchors };
}

/**
 * Resolves a transcript to a triage outcome, or refuses.
 *
 * Refusal is the default. A protocol is only returned when a real symptom
 * anchor fired AND the winner is both dense enough and clearly ahead of the
 * runner-up.
 */
export function resolveTriageOutcome(
  transcript: string,
  protocols: EmergencyProtocol[]
): TriageOutcome {
  const tokens = tokenize(transcript);
  if (tokens.length === 0) {
    return abstain('empty-transcript');
  }

  const ranked = rankProtocols(transcript, protocols, protocols.length);
  const top = ranked[0];
  const second = ranked[1];

  // No usable evidence at all — this is the case that used to become CPR.
  const anchorWeight = top.anchors.reduce((n, a) => n + phraseWeight(a), 0);
  if (anchorWeight < MIN_ANCHOR_WEIGHT) {
    return abstain('no-anchor-match', top.anchors);
  }

  // Exact tie: two protocols with identical evidence. Refusing is correct —
  // picking one here is a coin flip with clinical consequences.
  if (second && Math.abs(top.score - second.score) < 1e-9) {
    return abstain('low-margin', top.anchors);
  }

  const gap = top.score - (second?.score ?? 0);
  const margin = top.score > 0 ? gap / top.score : 0;
  const density = Math.min(1, anchorWeight / 4);
  const confidence = +(margin * density).toFixed(3);

  if (confidence < MIN_CONFIDENCE) {
    return abstain(anchorWeight < MIN_ANCHOR_WEIGHT ? 'incomplete-transcript' : 'low-confidence', top.anchors);
  }

  return {
    kind: 'matched',
    protocol: top.protocol,
    confidence,
    margin: +margin.toFixed(3),
    anchors: top.anchors,
  };
}

/**
 * Back-compat helper for callers that genuinely want the top candidate.
 * Returns null rather than fabricating a protocol. Prefer resolveTriageOutcome.
 */
export function resolveTopProtocol(
  transcript: string,
  protocols: EmergencyProtocol[]
): ProtocolMatch | null {
  const outcome = resolveTriageOutcome(transcript, protocols);
  if (outcome.kind !== 'matched') return null;
  const ranked = rankProtocols(transcript, protocols, protocols.length);
  const hit = ranked.find((r) => r.protocol.id === outcome.protocol.id);
  return hit ?? null;
}

export { MIN_CONFIDENCE, MIN_ANCHOR_WEIGHT };

// Shared with the guidance-category ranker so both corpora stem and match
// identically. Two copies of this is how two corpora start disagreeing.
export { tokenize, phrasePresent, phraseWeight };
