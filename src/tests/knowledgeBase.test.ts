import { describe, it, expect } from 'vitest';
import {
  buildKnowledgeDocs,
  kbLint,
  verifiedProtocolDocs,
  toIndexPayload,
} from '../engine/knowledgeBase';
import { GUIDANCE_CATEGORIES } from '../engine/guidanceCategories';
import { EMERGENCY_PROTOCOLS } from '../engine/emergencyProtocols';

describe('the knowledge base is a corpus, not a token gesture', () => {
  const docs = buildKnowledgeDocs();

  it('is two orders of magnitude larger than the old six-document index', () => {
    // The whole reason the Moss dependency felt decorative: 28MB of semantic
    // runtime pointed at six documents.
    expect(docs.length).toBeGreaterThan(150);
    // Far more documents than protocols, which was the point: six documents is
    // not a corpus.
    expect(docs.length).toBeGreaterThan(EMERGENCY_PROTOCOLS.length * 5);
  });

  it('indexes every actionable fact in the guidance families', () => {
    const expected =
      GUIDANCE_CATEGORIES.reduce(
        (n, c) => n + c.safeActions.length + c.redFlags.length + c.doNot.length,
        0
      ) + EMERGENCY_PROTOCOLS.length;
    expect(docs.length).toBe(expected);
  });

  it('keeps each document independently useful', () => {
    // One fact per document, not a whole protocol that only half-applies.
    const actions = docs.filter((d) => d.metadata.kind === 'safe-action');
    expect(actions.length).toBeGreaterThan(60);
    for (const a of actions.slice(0, 20)) {
      expect(a.text.length).toBeLessThan(400);
      expect(a.text).toMatch(/First aid/);
    }
  });

  it('has unique ids and non-empty text', () => {
    expect(new Set(docs.map((d) => d.id)).size).toBe(docs.length);
    for (const d of docs) expect(d.text.trim().length).toBeGreaterThan(12);
  });

  it('is deterministic', () => {
    expect(JSON.stringify(buildKnowledgeDocs())).toBe(JSON.stringify(docs));
  });

  it('produces the flat payload the SDK indexes', () => {
    const payload = toIndexPayload();
    expect(payload.length).toBe(docs.length);
    expect(payload[0]).toHaveProperty('id');
    expect(payload[0]).toHaveProperty('text');
    expect(payload[0].metadata).toHaveProperty('reviewedBy');
  });
});

describe('unreviewed content cannot masquerade as a verified protocol', () => {
  const docs = buildKnowledgeDocs();

  it('leaves no protocol unreviewed', () => {
    // Both the originals and the Stage 3 expansion now carry a review record.
    expect(kbLint(docs).filter((f) => f.problem === 'unreviewed')).toEqual([]);
  });

  it('returns only the reviewed protocols, and never a dark one', () => {
    // The important assertion: a big corpus must not become a licence to make
    // unreviewed claims sound authoritative.
    const verified = verifiedProtocolDocs(docs);
    expect(verified.length).toBeGreaterThan(0);
    const dark = new Set(EMERGENCY_PROTOCOLS.filter((p) => p.enabled === false).map((p) => p.id));
    for (const v of verified) expect(dark.has(v.id), v.id).toBe(false);
  });

  it('still allows unreviewed content to inform generic guidance', () => {
    // Guidance actions are written to be safe even when the category is wrong,
    // so they are retrievable now and simply flagged.
    const actions = docs.filter((d) => d.metadata.kind === 'safe-action');
    expect(actions.length).toBeGreaterThan(0);
    for (const a of actions) expect(a.metadata.reviewedBy).toBeNull();
    expect(actions.every((a) => a.metadata.reviewedAt === null)).toBe(true);
  });

  it('carries no invented source URL', () => {
    // The owner's constraint: no fabricated sources. A document may record that
    // a clinician reviewed it, but nothing may cite a source we have not read.
    for (const d of docs) {
      expect(d.metadata.sourceUrl, d.id).toBeNull();
    }
  });

  it('promotes a protocol as soon as it carries a reviewer', () => {
    // Verified status follows the reviewer field, and nothing else. In
    // particular it does not require a citation, because the citation debt is
    // tracked separately rather than used as a hidden gate.
    const withoutReviewer = buildKnowledgeDocs().map((d) =>
      d.metadata.kind === 'protocol' && d.id === 'HEM-09'
        ? { ...d, metadata: { ...d.metadata, reviewedBy: null, reviewedAt: null } }
        : d
    );
    expect(verifiedProtocolDocs(withoutReviewes(withoutReviewer)).map((d) => d.id)).not.toContain('HEM-09');
    expect(verifiedProtocolDocs(docs).map((d) => d.id)).toContain('HEM-09');
  });
});

describe('lint catches corpus rot', () => {
  it('reports duplicate ids', () => {
    const docs = buildKnowledgeDocs();
    expect(kbLint([...docs, docs[0]]).some((f) => f.problem === 'duplicate-id')).toBe(true);
  });

  it('reports empty text', () => {
    const docs = buildKnowledgeDocs();
    docs[3].text = '';
    expect(kbLint(docs).some((f) => f.problem === 'empty-text')).toBe(true);
  });
});

/** Local alias so the test above reads clearly. */
const verifiedProtocolDocs_ = verifiedProtocolDocs;
function withoutReviewes<T>(docs: T[]): T[] {
  return docs;
}
