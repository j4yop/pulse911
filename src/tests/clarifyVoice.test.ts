import { describe, it, expect } from 'vitest';
import { matchSpokenAnswer } from '../engine/clarifyVoice';
import { CLARIFY_QUESTIONS, questionById } from '../engine/clarify';

const q = (id: string) => questionById(id)!;
const labelOf = (spoken: string, id: string) =>
  matchSpokenAnswer(spoken, q(id))?.label ?? null;

describe('short spoken answers map deliberately', () => {
  it('maps yes to the single affirmative option', () => {
    expect(labelOf('yes', 'breathing')).toBe('Yes, breathing normally');
    expect(labelOf('yeah', 'breathing')).toBe('Yes, breathing normally');
    expect(labelOf('correct', 'breathing')).toBe('Yes, breathing normally');
  });

  it('maps no to the single negative option', () => {
    expect(labelOf('no', 'bleeding')).toBe('No bleeding');
    expect(labelOf('nope', 'bleeding')).toBe('No bleeding');
  });

  it('maps the unsure phrasings people actually use', () => {
    for (const phrase of ['not sure', 'no idea', 'dunno', 'i do not know', 'unknown']) {
      expect(labelOf(phrase, 'consciousness'), phrase).toBe('Not sure');
    }
  });

  it('maps a substantive answer, not just yes/no', () => {
    expect(labelOf('not breathing normally', 'breathing')).toBe('No, not breathing normally');
    expect(labelOf('he is unresponsive', 'consciousness')).toBe('No, unresponsive');
    expect(labelOf('yes she is pregnant', 'pregnancy')).toBe('Yes, pregnant');
  });
});

describe('it refuses rather than guesses', () => {
  /**
   * The whole safety argument. A misheard clinical answer selects the wrong
   * protocol for a real person, so ambiguity must produce no action at all.
   */
  it('returns null for an utterance that matches nothing', () => {
    for (const said of ['what is the weather like', 'hello there', 'um', 'the cat sat down']) {
      expect(matchSpokenAnswer(said, q('breathing')), said).toBeNull();
    }
  });

  it('returns null for empty and whitespace input', () => {
    expect(matchSpokenAnswer('', q('breathing'))).toBeNull();
    expect(matchSpokenAnswer('   ', q('breathing'))).toBeNull();
  });

  it('maps pregnancy yes and no', () => {
    expect(labelOf('yes', 'pregnancy')).toBe('Yes, pregnant');
    expect(labelOf('no', 'pregnancy')).toBe('No');
  });

  it('refuses a genuine tie between the Yes and No options', () => {
    // "breathing normally" matches both "Yes, breathing normally" and
    // "No, not breathing normally" on their shared content words, and the
    // operator gave no marker to break it. Refuse rather than pick a side.
    expect(matchSpokenAnswer('breathing normally', q('breathing'))).toBeNull();
    // Adding the marker resolves it, which is what makes this safe to ship.
    expect(labelOf('yes breathing normally', 'breathing')).toBe('Yes, breathing normally');
    expect(labelOf('no breathing normally', 'breathing')).toBe('No, not breathing normally');
  });

  it('never picks a non-yes/no option from a bare yes or no', () => {
    // "Breathing but struggling" is a real clinical option, but a bare "yes"
    // must not land on it.
    expect(labelOf('yes', 'breathing')).toBe('Yes, breathing normally');
    expect(matchSpokenAnswer('yes', q('breathing'))?.label).not.toContain('struggling');
    // Age has no yes/no options, so "yes" is meaningless and must be refused.
    expect(matchSpokenAnswer('yes', q('age'))).toBeNull();
  });
it('can resolve every question with its own affirmative option', () => {
    for (const question of CLARIFY_QUESTIONS) {
      const affirmative = question.options.find((o) => o.label.startsWith('Yes'));
      if (!affirmative) continue;
      // Speaking the option's own words must resolve it.
      expect(
        matchSpokenAnswer(affirmative.label.toLowerCase(), question)?.label,
        question.id
      ).toBe(affirmative.label);
    }
  });
});
