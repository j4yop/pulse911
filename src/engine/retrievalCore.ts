import type { EmergencyProtocol } from '../types';

/**
 * Retrieval Core — pure, deterministic protocol ranking.
 *
 * This module has zero I/O and zero SDK dependencies: given a transcript and the
 * protocol corpus it always produces the same ranking. It serves two purposes:
 *
 *  1. It IS the local-fallback ranker used when the Moss WASM runtime is
 *     unavailable (offline demo, missing credentials) — real work, honestly
 *     measured by the caller, labeled `local-fallback` in the UI.
 *  2. It is directly unit-testable (vitest, node environment, no mocks),
 *     which is how we guarantee every demo scenario resolves its intended
 *     protocol BEFORE standing in front of judges.
 *
 * Scoring model (transparent, not neural):
 *  - Keyword phrase hits, weighted by phrase length (a 3-word phrase like
 *    "digital arrest" is a much stronger signal than a 1-word hit).
 *  - Sublinear-damped overlap of transcript tokens against title + summary.
 *  - Deterministic tiebreak: corpus order (stable across runs).
 */

export interface ProtocolMatch {
  protocol: EmergencyProtocol;
  score: number;
}

/** Weight of a keyword hit grows with the number of words in the phrase. */
function phraseWeight(phrase: string): number {
  return phrase.trim().split(/\s+/).filter(Boolean).length;
}

export function rankProtocols(
  transcript: string,
  protocols: EmergencyProtocol[],
  topK = 3
): ProtocolMatch[] {
  const t = transcript.toLowerCase();
  const tokens = t.split(/[^a-z0-9]+/).filter((w) => w.length > 3);

  const scored = protocols.map((p, corpusIndex) => {
    let score = 0;

    // 1. Keyword phrase hits (the dominant signal).
    for (const kw of p.keywords) {
      if (t.includes(kw.toLowerCase())) {
        score += phraseWeight(kw);
      }
    }

    // 2. Weak lexical overlap on title/summary tokens (tiebreaker, damped).
    const corpus = `${p.title} ${p.clinicalSummary}`.toLowerCase();
    let overlap = 0;
    for (const tok of tokens) {
      if (corpus.includes(tok)) overlap += 0.1;
    }
    score += Math.min(overlap, 1); // cap the tiebreaker so keywords dominate

    return { protocol: p, score, corpusIndex };
  });

  // Sort by score desc; corpus order breaks ties deterministically.
  scored.sort((a, b) => b.score - a.score || a.corpusIndex - b.corpusIndex);

  return scored.slice(0, Math.max(1, topK)).map(({ protocol, score }) => ({
    protocol,
    score: +score.toFixed(2),
  }));
}

/** Highest-scoring protocol for a transcript (what the engine dispatches on). */
export function resolveTopProtocol(
  transcript: string,
  protocols: EmergencyProtocol[]
): ProtocolMatch {
  return rankProtocols(transcript, protocols, 1)[0];
}
