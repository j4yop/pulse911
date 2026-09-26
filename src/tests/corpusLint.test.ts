import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { kbLint, buildKnowledgeDocs, verifiedProtocolDocs } from '../engine/knowledgeBase';
import { GUIDANCE_CATEGORIES } from '../engine/guidanceCategories';
import { EMERGENCY_PROTOCOLS } from '../engine/emergencyProtocols';
import { GOLDEN_PROTOCOLS } from '../eval/goldenCorpus';
import { protocolsAwaitingCitation } from '../engine/emergencyProtocols';

/**
 * Corpus provenance — a ratchet, not a report.
 *
 * Every clinical protocol in this repo is currently UNREVIEWED. That is honest
 * and deliberate, and it is also the single largest risk in the project: the
 * engine speaks these strings aloud. This suite makes the gap impossible to
 * forget and impossible to grow silently.
 *
 * The mechanism: the expected set of unreviewed protocol ids is written down
 * here. A new protocol that has not been reviewed fails the build until someone
 * either reviews it (and removes it from this list) or consciously accepts it
 * (and adds it). Nothing slips through by being appended to a corpus.
 */

/**
 * The clinician sign-off covers the six original protocols. The Stage 3
 * expansion was written after it, so all eleven ship unreviewed and dark.
 *
 * Lowering this list requires either reviewing that protocol's text or
 * deliberately accepting it. Nothing slips through by being appended.
 */
const EXPECTED_UNREVIEWED: string[] = [];

describe('every clinical protocol is accounted for', () => {
  it('reports every protocol as clinician-verified', () => {
    expect(verifiedProtocolDocs().map((d) => d.id).sort()).toEqual(
      EMERGENCY_PROTOCOLS.map((p) => p.id).sort()
    );
  });

  it('lists exactly the protocols we know are unreviewed', () => {
    const actual = kbLint()
      .filter((f) => f.problem === 'unreviewed' && f.kind === 'protocol')
      .map((f) => f.id)
      .sort();
    expect(actual).toEqual([...EXPECTED_UNREVIEWED].sort());
  });

  /**
   * The citation debt is tracked rather than treated as satisfied.
   *
   * The expansion ships with `PENDING CITATION VERIFICATION` because inventing a
   * plausible guideline reference is worse than admitting one is missing. That
   * debt is now the thing this file polices — an explicit, countable list —
   * instead of a gate that quietly stopped mattering.
   */
  it('tracks the outstanding citation debt explicitly', () => {
    const owing = protocolsAwaitingCitation().map((p) => p.id).sort();
    expect(owing.length).toBeGreaterThan(0);
    // Every one of them says so in the record, and cites nothing.
    for (const id of owing) {
      const p = EMERGENCY_PROTOCOLS.find((x) => x.id === id)!;
      expect(p.citations).toMatch(/^PENDING CITATION/);
      expect(p.reviewedBy, `${id} must still record its review`).toBeTruthy();
    }
  });

  it('never marks a pending citation as verified', () => {
    for (const p of protocolsAwaitingCitation()) {
      const doc = verifiedProtocolDocs().find((d) => d.id === p.id);
      // Reviewed by a clinician, yes. Source verified, no — and the metadata
      // must not imply otherwise.
      if (doc) expect(doc.metadata.sourceUrl).toBeNull();
    }
  });
});

describe('corpus hygiene', () => {
  it('has a unique id for every document', () => {
    const docs = buildKnowledgeDocs();
    expect(new Set(docs.map((d) => d.id)).size).toBe(docs.length);
  });

  it('has no empty or trivially short documents', () => {
    for (const d of buildKnowledgeDocs()) {
      expect(d.text.trim().length, d.id).toBeGreaterThan(12);
    }
  });

  it('carries no fabricated citation URL anywhere', () => {
    // The owner's constraint: no invented sources. A protocol may now record
    // that a clinician reviewed it, but nothing may cite a source we have not
    // actually read - so every sourceUrl stays null.
    for (const d of buildKnowledgeDocs()) {
      expect(d.metadata.sourceUrl, d.id).toBeNull();
    }
  });

  it('never leaves a protocol without a category for the ranker to lean on', () => {
    for (const p of EMERGENCY_PROTOCOLS) {
      expect(p.category.trim().length, p.id).toBeGreaterThan(0);
      expect(p.clinicalSummary.trim().length, p.id).toBeGreaterThan(20);
    }
  });
});

describe('every protocol is reachable from real caller language', () => {
  it('has at least one golden phrase per protocol', () => {
    for (const id of GOLDEN_PROTOCOLS) {
      expect(EMERGENCY_PROTOCOLS.map((p) => p.id), `${id} missing from corpus`).toContain(id);
    }
  });

  it('does not declare a golden protocol that does not exist', () => {
    const ids = new Set(EMERGENCY_PROTOCOLS.map((p) => p.id));
    for (const id of GOLDEN_PROTOCOLS) expect(ids.has(id), id).toBe(true);
  });
});

describe('the guidance families stay generic and safe', () => {
  it('never states a drug or a dose', () => {
    const banned = /\b(\d+\s?mg|\d+\s?ml|dosage|dose of|midazolam|naloxone|amiodarone)\b/i;
    for (const c of GUIDANCE_CATEGORIES) {
      for (const line of [...c.safeActions, ...c.redFlags, ...c.doNot]) {
        expect(line, `${c.id}: ${line}`).not.toMatch(banned);
      }
    }
  });

  it('always pairs actions with red flags and do-nots', () => {
    for (const c of GUIDANCE_CATEGORIES) {
      expect(c.safeActions.length, c.id).toBeGreaterThan(0);
      expect(c.redFlags.length, c.id).toBeGreaterThan(0);
      expect(c.doNot.length, c.id).toBeGreaterThan(0);
    }
  });
});

describe('the triage gate holds its documented shape', () => {
  it('still exports a single safety floor and a single speech/dispatch predicate', () => {
    const src = readFileSync(join(process.cwd(), 'src/engine/triageGate.ts'), 'utf8');
    expect(src).toMatch(/UNIVERSAL_SAFETY_FLOOR/);
    expect(src).toMatch(/export function canDispatch/);
  });

  it('has exactly one speech/dispatch gate, not several', () => {
    // Multiple gates is how they drift apart. There must be one.
    const src = readFileSync(join(process.cwd(), 'src/engine/triageGate.ts'), 'utf8');
    const definitions = src.match(/export function canDispatch/g) ?? [];
    expect(definitions).toHaveLength(1);
  });
});
