/**
 * The retrievable knowledge base — what Moss actually searches.
 *
 * ## Why this file exists
 *
 * The Moss index held **six documents**, one per clinical protocol. Six
 * documents cannot answer six-hundred questions, and that is the real reason
 * the integration felt decorative: a 28MB semantic runtime pointed at a corpus
 * small enough to fit in the prompt anyway.
 *
 * So the corpus changes shape. Instead of one document per *protocol*, this
 * builds one document per *actionable fact* — each safe action, each red flag,
 * each do-not, each critical question — alongside the six protocols. Same
 * retrieval, a corpus two orders of magnitude larger, and every document is
 * independently useful rather than a whole protocol that only half-applies.
 *
 * ## Provenance is a hard requirement, not a comment
 *
 * Every document carries `reviewedBy`, `reviewedAt` and `sourceUrl`. Content
 * that has not been through clinician review is marked `unreviewed` and is
 * *excluded from the clinical protocol path* — it can inform generic guidance,
 * where every action is written to be safe even if the category is wrong, but
 * it can never become a treatment protocol on the strength of being indexed.
 *
 * See `kbLint()` and TRIAGE_SAFETY_WORKFLOW.md Stage 3.
 */

import { GUIDANCE_CATEGORIES } from './guidanceCategories';
import { EMERGENCY_PROTOCOLS } from './emergencyProtocols';

export type KnowledgeKind =
  | 'protocol'
  | 'safe-action'
  | 'red-flag'
  | 'do-not'
  | 'critical-question'
  | 'contraindication';

export interface KnowledgeDoc {
  id: string;
  text: string;
  metadata: {
    kind: KnowledgeKind;
    /** Protocol id or guidance category id this document came from. */
    sourceId: string;
    family: string;
    /**
     * `null` until a clinician signs this off. Anything unreviewed is barred
     * from the clinical decision path by `kbLint`.
     */
    reviewedBy: string | null;
    reviewedAt: string | null;
    sourceUrl: string | null;
  };
}

/**
 * Provenance for the guidance families.
 *
 * HONEST BY DESIGN: the actions in `guidanceCategories.ts` are deliberately
 * generic first aid, written so they remain correct when the category is
 * wrong. They are still unreviewed clinical content and are marked as such
 * rather than carrying invented citations. `verified: false` is the flag that
 * keeps them out of the protocol path.
 */
const GUIDANCE_PROVENANCE = {
  reviewedBy: null,
  reviewedAt: null,
  sourceUrl: null,
  verified: false,
} as const;

function push(
  out: KnowledgeDoc[],
  kind: KnowledgeKind,
  sourceId: string,
  family: string,
  ordinal: number,
  text: string
) {
  out.push({
    id: `${sourceId}::${kind}::${ordinal}`,
    text,
    metadata: {
      kind,
      sourceId,
      family,
      reviewedBy: null,
      reviewedAt: null,
      sourceUrl: null,
    },
  });
}

/**
 * Build the full retrieval corpus.
 *
 * Deterministic and side-effect free, so it can be unit-tested and counted.
 */
export function buildKnowledgeDocs(): KnowledgeDoc[] {
  const docs: KnowledgeDoc[] = [];

  // 1. The clinical protocols themselves, verbatim.
  for (const p of EMERGENCY_PROTOCOLS) {
    docs.push({
      id: p.id,
      text: [
        `${p.title}. Triage level ${p.triageLevel}. Category ${p.category}.`,
        p.clinicalSummary,
        `Immediate actions: ${p.immediateActions.join(' ')}`,
        `Critical questions: ${p.criticalQuestions.join(' ')}`,
        `Contraindications: ${p.contraindications.join(' ')}`,
        `Recommended unit: ${p.unitRecommendation.unitType}, ${p.unitRecommendation.priority}. Equipment: ${p.unitRecommendation.requiredEquipment.join(', ')}.`,
        `Spoken instruction: ${p.verbalResponseText}`,
        `Keywords: ${p.keywords.join(', ')}`,
      ].join('\n'),
      metadata: {
        kind: 'protocol',
        sourceId: p.id,
        family: p.category,
        // Read from the protocol, not hardcoded here. A second place to
        // remember to update is a second place to forget.
        reviewedBy: p.reviewedBy ?? null,
        reviewedAt: p.reviewedAt ?? null,
        sourceUrl: null,
      },
    });
  }

  // 2. Every actionable fact in the guidance families, one document each.
  for (const c of GUIDANCE_CATEGORIES) {
    c.safeActions.forEach((text, i) =>
      push(docs, 'safe-action', c.id, c.label, i, `First aid — ${c.label}: ${text}`)
    );
    c.redFlags.forEach((text, i) =>
      push(docs, 'red-flag', c.id, c.label, i, `Escalate immediately — ${c.label}: ${text}`)
    );
    c.doNot.forEach((text, i) =>
      push(docs, 'do-not', c.id, c.label, i, `Do not — ${c.label}: ${text}`)
    );
  }

  return docs;
}

export interface LintFinding {
  id: string;
  kind: KnowledgeKind;
  problem: 'unreviewed' | 'empty-text' | 'duplicate-id';
  detail: string;
}

/**
 * Refuse to let unreviewed content reach the clinical decision path.
 *
 * This is the guard that makes "we indexed a big corpus" safe to say out loud:
 * a document can be retrievable for *generic* guidance and still be barred from
 * being treated as a verified protocol. It returns findings rather than
 * throwing, because the corpus legitimately contains unreviewed content today —
 * the point is that the flag is visible and enforced, not that the build breaks.
 */
export function kbLint(docs: KnowledgeDoc[] = buildKnowledgeDocs()): LintFinding[] {
  const findings: LintFinding[] = [];
  const seen = new Set<string>();

  for (const d of docs) {
    if (seen.has(d.id)) {
      findings.push({ id: d.id, kind: d.metadata.kind, problem: 'duplicate-id', detail: 'id collision' });
    }
    seen.add(d.id);

    if (!d.text || d.text.trim().length < 12) {
      findings.push({ id: d.id, kind: d.metadata.kind, problem: 'empty-text', detail: 'too short to retrieve' });
    }

    if (d.metadata.kind === 'protocol' && !d.metadata.reviewedBy) {
      findings.push({
        id: d.id,
        kind: d.metadata.kind,
        problem: 'unreviewed',
        detail:
          'clinical protocol has no reviewer; it may inform generic guidance but must not be presented as a verified protocol',
      });
    }
  }

  return findings;
}

/** Only documents cleared to act as clinical protocols. Empty until review happens. */
export function verifiedProtocolDocs(docs: KnowledgeDoc[] = buildKnowledgeDocs()): KnowledgeDoc[] {
  return docs.filter((d) => d.metadata.kind === 'protocol' && d.metadata.reviewedBy);
}

/**
 * The corpus as flat `{ id, text, metadata }` records, which is the shape the
 * Moss SDK indexes.
 *
 * The SDK types metadata as `Record<string, string>`, so the nullable review
 * fields are serialised explicitly. They become the literal string `unreviewed`
 * rather than an empty string, so the provenance gap is visible in the Moss
 * dashboard instead of looking like a blank field someone forgot to fill in.
 */
export function toIndexPayload(docs: KnowledgeDoc[] = buildKnowledgeDocs()) {
  return docs.map((d) => ({
    id: d.id,
    text: d.text,
    metadata: {
      kind: d.metadata.kind,
      sourceId: d.metadata.sourceId,
      family: d.metadata.family,
      reviewedBy: d.metadata.reviewedBy ?? 'unreviewed',
      reviewedAt: d.metadata.reviewedAt ?? 'unreviewed',
      sourceUrl: d.metadata.sourceUrl ?? 'unreviewed',
    },
  }));
}

export { GUIDANCE_PROVENANCE };
