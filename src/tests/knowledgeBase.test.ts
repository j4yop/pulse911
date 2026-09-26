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
    expect(docs.length / EMERGENCY_PROTOCOLS.length).toBeGreaterThan(20);
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

  it('flags every clinical protocol as unreviewed today', () => {
    const unreviewed = kbLint(docs).filter(
      (f) => f.problem === 'unreviewed' && f.kind === 'protocol'
    );
    expect(unreviewed.length).toBe(EMERGENCY_PROTOCOLS.length);
  });

  it('returns no verified protocols while review is outstanding', () => {
    // The important assertion: a big corpus must not become a licence to make
    // unreviewed claims sound authoritative.
    expect(verifiedProtocolDocs(docs)).toEqual([]);
  });

  it('still allows unreviewed content to inform generic guidance', () => {
    // Guidance actions are written to be safe even when the category is wrong,
    // so they are retrievable now and simply flagged.
    const actions = docs.filter((d) => d.metadata.kind === 'safe-action');
    expect(actions.length).toBeGreaterThan(0);
    for (const a of actions) expect(a.metadata.reviewedBy).toBeNull();
  });

  it('carries no invented citations', () => {
    // The owner's constraint: new clinical content must not carry fabricated
    // sources. Every document must ship with null provenance until reviewed.
    for (const d of docs) {
      expect(d.metadata.sourceUrl).toBeNull();
      expect(d.metadata.reviewedAt).toBeNull();
    }
  });

  it('promotes a protocol once it is reviewed', () => {
    const reviewed = buildKnowledgeDocs().map((d) =>
      d.metadata.kind === 'protocol' && d.id === 'CARD-01'
        ? { ...d, metadata: { ...d.metadata, reviewedBy: 'clinician', reviewedAt: '2026-09-26' } }
        : d
    );
    expect(verifiedProtocolDocs(reviewed).map((d) => d.id)).toEqual(['CARD-01']);
    expect(kbLint(reviewed).filter((f) => f.problem === 'unreviewed')).toHaveLength(
      EMERGENCY_PROTOCOLS.length - 1
    );
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
