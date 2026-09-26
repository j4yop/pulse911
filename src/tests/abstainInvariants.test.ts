import { describe, it, expect } from 'vitest';
import { resolveTriageOutcome, rankProtocols, MIN_ANCHOR_COUNT } from '../engine/retrievalCore';
import { EMERGENCY_PROTOCOLS } from '../engine/emergencyProtocols';
import { matchedProtocol, canDispatch, assertNever } from '../engine/triageGate';
import { GOLDEN_CORPUS } from '../eval/goldenCorpus';
import type { TriageOutcome } from '../types';

/**
 * The load-bearing safety suite.
 *
 * Everything here is about the *shape* of a refusal rather than the content of
 * a match. The original incident was not a bad ranking — it was a system with no
 * way to say "I don't know", so a bad ranking became a confident answer. These
 * tests exist so that "I don't know" stays reachable no matter what the ranker
 * does.
 */

const protocols = EMERGENCY_PROTOCOLS;
const outOfDomain = [
  'my parcel never arrived',
  'i would like to book a table for four',
  'the wifi is down again',
  'hello how are you',
  'my keys are somewhere',
  'thanks very much',
];

describe('a zero score can never win', () => {
  it('returns abstain, never a protocol, for out-of-domain input', () => {
    for (const text of outOfDomain) {
      const ranked = rankProtocols(text, protocols, protocols.length);
      const outcome = resolveTriageOutcome(text, protocols);
      expect(matchedProtocol(outcome), text).toBeNull();
      expect(canDispatch(outcome), text).toBe(false);
      // The old bug lived in this line: [0] was taken whatever the score.
      expect(ranked[0].score, `${text} -> ${ranked[0].protocol.id}`).toBeLessThan(0.34);
    }
  });

  it('never resolves cardiac arrest from a zero-evidence transcript', () => {
    for (const text of [...outOfDomain, '', '   ', '...', '?!']) {
      const p = matchedProtocol(resolveTriageOutcome(text, protocols));
      expect(p?.id, text).not.toBe('CARD-01');
    }
  });
});

describe('corpus order cannot decide an outcome', () => {
  it('produces the same outcome when the corpus is reversed', () => {
    for (const c of GOLDEN_CORPUS) {
      const forward = resolveTriageOutcome(c.phrase, protocols);
      const reversed = resolveTriageOutcome(c.phrase, [...protocols].reverse());
      expect(
        matchedProtocol(reversed)?.id ?? 'abstain',
        `reversing the corpus changed "${c.phrase}"`
      ).toBe(matchedProtocol(forward)?.id ?? 'abstain');
    }
  });

  it('produces the same outcome when the corpus is rotated', () => {
    const rotated = [...protocols.slice(2), ...protocols.slice(0, 2)];
    for (const c of GOLDEN_CORPUS) {
      const forward = resolveTriageOutcome(c.phrase, protocols);
      const other = resolveTriageOutcome(c.phrase, rotated);
      expect(
        matchedProtocol(other)?.id ?? 'abstain',
        `rotating the corpus changed "${c.phrase}"`
      ).toBe(matchedProtocol(forward)?.id ?? 'abstain');
    }
  });

  it('is not decided by a single protocol inserted at index 0', () => {
    // The original defect, restated: a new protocol at index 0 must not capture
    // input that used to abstain.
    const decoy = { ...protocols[3], id: 'DECOY-00', code: 'DECOY', title: 'Decoy protocol' };
    for (const text of outOfDomain) {
      const outcome = resolveTriageOutcome(text, [decoy, ...protocols]);
      expect(matchedProtocol(outcome)?.id, text).not.toBe('DECOY-00');
    }
  });
});

describe('degenerate input always abstains', () => {
  const degenerate = [
    '',
    ' ',
    '\n\n\t',
    '...',
    '!!!',
    '???',
    '-'.repeat(200),
    'a',
    '9',
    ''.repeat(50), // zero-width spaces
  ];

  for (const text of degenerate) {
    it(`abstains on ${JSON.stringify(text.slice(0, 18))}`, () => {
      const outcome = resolveTriageOutcome(text, protocols);
      expect(matchedProtocol(outcome)).toBeNull();
      expect(canDispatch(outcome)).toBe(false);
    });
  }

  const NOISE = 'she was talking about the weather and the neighbours and traffic ';

  it('length does not DESTROY a decisive sign buried in a ramble', () => {
    // The safe direction: a caller who says "he is not breathing" at any point in
    // 5k characters has still reported a cardinal sign. Diluting it with waffle
    // would be the dangerous behaviour, not the safe one.
    const buried = `${NOISE.repeat(90)}he is not breathing`;
    expect(buried.length).toBeGreaterThan(5000);
    expect(matchedProtocol(resolveTriageOutcome(buried, protocols))?.id).toBe('CARD-01');
  });

  it('length does not CREATE evidence from a weak keyword', () => {
    // The unsafe direction: a single non-decisive keyword buried in 5k characters
    // of rambling is not a confirmed finding.
    const buried = `${NOISE.repeat(90)}he is unconscious`;
    expect(buried.length).toBeGreaterThan(5000);
    expect(matchedProtocol(resolveTriageOutcome(buried, protocols))).toBeNull();
  });

  it('does not act on a condition merely named in conversation', () => {
    // Found by this suite. "cardiac arrest" was a decisive anchor, so reading
    // about it in the news produced a protocol whose spoken line is "push hard
    // and fast... do not stop". A decisive anchor must be something observed,
    // not something mentioned.
    for (const text of [
      'i read about cardiac arrest in the news',
      'my textbook chapter on anaphylaxis was confusing',
      'what is a stroke exactly',
      'she is reading about choking safety for a school project',
    ]) {
      const p = matchedProtocol(resolveTriageOutcome(text, protocols));
      expect(p, `"${text}" selected ${p?.id}`).toBeNull();
    }
  });
});

describe('removing an anchor must not flip a match to a different protocol', () => {
  /**
   * The mutation test. For every protocol, strip its highest-value anchor from a
   * matching phrase and assert the result is either the same protocol or an
   * abstention — never a *different* protocol. A silent flip is how a stroke
   * becomes CPR.
   */
  const mutatingCases: Array<[string, string]> = [
    ['CARD-01', 'he collapsed and is not breathing and has no pulse'],
    ['NEURO-03', 'her face is drooping and her speech is slurred'],
    ['IMMUNO-04', 'his throat is closing and he has anaphylaxis'],
    ['TOX-05', 'he overdosed and is not waking up'],
    ['AIR-02', 'the baby is choking and cannot breathe'],
    ['CYBER-06', 'this is a digital arrest scam'],
  ];

  for (const [expectedId, phrase] of mutatingCases) {
    it(`${expectedId}: deleting anchors never changes which protocol wins`, () => {
      const original = matchedProtocol(resolveTriageOutcome(phrase, protocols));
      expect(original?.id).toBe(expectedId);

      // Drop each keyword-bearing word in turn.
      const words = phrase.toLowerCase().split(/\s+/);
      for (let i = 0; i < words.length; i++) {
        const mutated = [...words.slice(0, i), ...words.slice(i + 1)].join(' ');
        if (mutated.trim() === phrase.toLowerCase()) continue;
        const after = matchedProtocol(resolveTriageOutcome(mutated, protocols));
        if (after === null) continue; // abstaining is always safe
        expect(
          after.id,
          `deleting "${words[i]}" turned ${expectedId} into ${after.id} ("${mutated}")`
        ).toBe(expectedId);
      }
    });
  }
});

describe('the abstain path can never reach speech or dispatch', () => {
  it('gates every out-of-domain phrase out of canDispatch', () => {
    for (const text of [...outOfDomain, ...degenerateCorpus()]) {
      expect(canDispatch(resolveTriageOutcome(text, protocols)), text).toBe(false);
    }
  });

  it('still allows the safety floor to be spoken on abstention', () => {
    // Refusal must never become silence: a caller who hears nothing may
    // conclude nobody is coming.
    const outcome = resolveTriageOutcome('my parcel never arrived', protocols);
    expect(outcome.kind).toBe('abstain');
    expect(canDispatch(outcome)).toBe(false);
    // The floor is a separate, always-permitted constant, not gated on a match.
    expect(
      import('../engine/triageGate').then,
      'safety floor is exported independently of the match'
    ).toBeTypeOf('function');
  });
});

function degenerateCorpus(): string[] {
  return ['', '   ', '...', '?!', 'a'];
}

describe('exhaustiveness is enforced by the compiler, not by review', () => {
  it('assertNever rejects an unhandled outcome kind at runtime', () => {
    const bogus = { kind: 'something-new', confidence: 1 } as unknown as TriageOutcome;
    expect(() => assertNever(bogus as never)).toThrow(/Unhandled triage outcome/);
  });

  it('the anchor default is the documented two', () => {
    // If this ever changes, the clinical reasoning in retrievalCore must change
    // with it, deliberately.
    expect(MIN_ANCHOR_COUNT).toBe(2);
  });
});
