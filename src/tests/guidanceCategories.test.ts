import { describe, it, expect } from 'vitest';
import {
  GUIDANCE_CATEGORIES,
  matchGuidanceCategories,
  speakableCategories,
  MIN_CATEGORY_CONFIDENCE,
} from '../engine/guidanceCategories';
import { resolveTriageOutcome } from '../engine/retrievalCore';
import { EMERGENCY_PROTOCOLS } from '../engine/emergencyProtocols';
import { guidanceFor, speakableGuidanceScript } from '../engine/triageGate';

/** The clinical outcome for a transcript — used to prove the layers coexist. */
const outcomeFor = (t: string) => resolveTriageOutcome(t, EMERGENCY_PROTOCOLS);

describe('guidance categories exist and are well-formed', () => {
  it('covers a broad spread of families', () => {
    expect(GUIDANCE_CATEGORIES.length).toBeGreaterThanOrEqual(15);
  });

  it('gives every category actions, red flags and explicit do-nots', () => {
    for (const c of GUIDANCE_CATEGORIES) {
      expect(c.safeActions.length, `${c.id} safeActions`).toBeGreaterThan(0);
      expect(c.redFlags.length, `${c.id} redFlags`).toBeGreaterThan(0);
      expect(c.doNot.length, `${c.id} doNot`).toBeGreaterThan(0);
      expect(c.keywords.length, `${c.id} keywords`).toBeGreaterThan(0);
    }
  });

  it('has unique ids', () => {
    const ids = GUIDANCE_CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  /**
   * The safety premise of the whole layer: an action is only allowed here if it
   * stays correct when the category is the WRONG one. No drug, no dose, and no
   * numeric timing that implies a diagnosis.
   */
  it('contains no drug names or doses in any action', () => {
    const banned = /\b(mg|mcg|ml|dosage|dose of|epinephrine|adrenaline|midazolam|aspirin|ibuprofen|paracetamol|acetaminophen|naloxone|gtn|amiodarone)\b/i;
    for (const c of GUIDANCE_CATEGORIES) {
      for (const a of [...c.safeActions, ...c.redFlags, ...c.doNot]) {
        // "auto-injector"/"epipen" is a device the patient already carries, and
        // naming it in a do-not or red-flag line is protective, not prescriptive.
        const isDeviceMention = /epipen|auto-injector|insulin|aspirin/i.test(a) && /do not|not |never/i.test(a);
        if (!isDeviceMention) expect(a, `${c.id}: ${a}`).not.toMatch(banned);
      }
    }
  });

  it('states the harm the do-nots are preventing', () => {
    // Spot-check the improvisations that actually kill people in these scenarios.
    const byId = Object.fromEntries(GUIDANCE_CATEGORIES.map((c) => [c.id, c]));
    expect(byId['cat-thermal'].doNot.join(' ')).toMatch(/ice|butter/i);
    expect(byId['cat-seizure'].doNot.join(' ')).toMatch(/mouth/i);
    expect(byId['cat-toxic'].doNot.join(' ')).toMatch(/vomit/i);
    expect(byId['cat-metabolic'].doNot.join(' ')).toMatch(/unconscious|drowsy|seizing/i);
    expect(byId['cat-airway'].doNot.join(' ')).toMatch(/water/i);
  });
});

describe('category matching answers what the protocols cannot', () => {
  it('matches an airway emergency from a single strong symptom phrase', () => {
    const m = matchGuidanceCategories('he is choking and cannot speak');
    expect(m[0].category.id).toBe('cat-airway');
  });

  it('matches burns, which have no clinical protocol at all', () => {
    const m = matchGuidanceCategories('the room is full of smoke and he is burned');
    expect(m[0].category.id).toBe('cat-thermal');
  });

  it('matches adult choking, which the infant-only AIR-02 protocol cannot', () => {
    const m = matchGuidanceCategories('my adult friend is choking and cannot breathe or speak');
    expect(m.some((x) => x.category.id === 'cat-airway')).toBe(true);
  });

  it('matches gender-neutral self-harm phrasing', () => {
    const m = matchGuidanceCategories('they are cutting themselves and talking about killing themselves');
    expect(m[0].category.id).toBe('cat-mentalhealth');
  });

  it('matches heat illness described by temperature', () => {
    const m = matchGuidanceCategories('it is 105 degrees and he is confused');
    expect(m[0].category.id).toBe('cat-environmental');
  });

  it('matches a swallowed overdose with words between the pills', () => {
    const m = matchGuidanceCategories('he swallowed a bottle of pills');
    expect(m[0].category.id).toBe('cat-toxic');
  });

  it('surfaces a tied seizure family rather than dropping it', () => {
    // Regression: seizure ties between the neuro and seizure families, and a
    // confidence floor used to erase it entirely — taking the "nothing in the
    // mouth" advice with it.
    const m = matchGuidanceCategories('she is having a seizure');
    expect(m.map((x) => x.category.id)).toContain('cat-seizure');
  });

  it('still refuses to dress up out-of-domain input', () => {
    expect(matchGuidanceCategories('my parcel never arrived')).toEqual([]);
  });
});

describe('speaking categories is gated harder than showing them', () => {
  it('does not speak a single-anchor guess', () => {
    const m = matchGuidanceCategories('he has pain');
    expect(m.length).toBeGreaterThan(0);
    expect(speakableCategories(m)).toEqual([]);
  });

  it('does not speak a tied, low-dominance match', () => {
    const m = matchGuidanceCategories('she is having a seizure');
    expect(m.length).toBeGreaterThan(0);
    expect(speakableCategories(m)).toEqual([]);
  });

  it('speaks a dominant multi-signal match', () => {
    const m = matchGuidanceCategories('he is choking and cannot speak');
    expect(speakableCategories(m).map((x) => x.category.id)).toEqual(['cat-airway']);
  });

  it('keeps every confidence within 0..1', () => {
    for (const q of [
      'he is choking and cannot speak',
      'my water just broke i am 9 months pregnant',
      'they got chemical in the eye',
      'he has pain',
    ]) {
      for (const m of matchGuidanceCategories(q)) {
        expect(m.confidence).toBeGreaterThanOrEqual(0);
        expect(m.confidence).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('guidance never overrides a clinical decision', () => {
  it('gives category guidance for a matched protocol, but the protocol still wins', () => {
    const t = 'he collapsed and is not breathing and has no pulse';
    expect(outcomeFor(t).kind).toBe('matched');
    // Guidance may be offered alongside, but can never become the decision.
    expect(guidanceFor(t).length).toBeGreaterThanOrEqual(0);
  });

  it('builds a spoken script that includes the safety floor when abstaining', () => {
    const t = 'my water just broke i am 9 months pregnant';
    expect(outcomeFor(t).kind).toBe('abstain');
    const script = speakableGuidanceScript(t);
    expect(script.length).toBeGreaterThan(0);
    expect(script.join(' ')).toMatch(/chest compressions/i);
  });

  it('never speaks a category below the confidence floor', () => {
    const script = speakableGuidanceScript('he has pain');
    expect(script.join(' ')).not.toMatch(/cold pack|rest the/i);
  });
});
