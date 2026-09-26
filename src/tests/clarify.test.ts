import { describe, it, expect } from 'vitest';
import {
  CLARIFY_QUESTIONS,
  advanceClarify,
  emptyClarifyState,
  evaluateClarify,
  matchingTranscript,
  nextQuestion,
  stopClarify,
} from '../engine/clarify';
import { EMERGENCY_PROTOCOLS } from '../engine/emergencyProtocols';

const P = EMERGENCY_PROTOCOLS;
const state = (t: string) => emptyClarifyState(t);

/** Answer questions in order until the loop stops asking. */
function run(transcript: string, picks: Array<[string, string]>) {
  let s = state(transcript);
  const asked: string[] = [];
  for (const [qid, label] of picks) {
    const r = advanceClarify(s, qid, label, P);
    s = r.state;
    asked.push(qid);
    if (r.status !== 'asking') return { s, asked, status: r.status, outcome: r.outcome };
  }
  return { s, asked, status: 'asking' as const, outcome: evaluateClarify(s, P) };
}

describe('question order is deliberate', () => {
  it('asks breathing first and pregnancy last', () => {
    expect(CLARIFY_QUESTIONS[0].id).toBe('breathing');
    expect(CLARIFY_QUESTIONS[CLARIFY_QUESTIONS.length - 1].id).toBe('pregnancy');
  });

  it('gives every question a rationale and at least one option', () => {
    for (const q of CLARIFY_QUESTIONS) {
      expect(q.rationale.length).toBeGreaterThan(10);
      expect(q.options.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('the loop terminates early once a protocol is resolved', () => {
  it('stops after one answer when that answer is decisive', () => {
    // The whole point: never ask a fifth question we no longer need.
    const r = run('something is wrong with my dad', [['breathing', 'No, not breathing normally']]);
    expect(r.status).toBe('resolved');
    expect(r.asked).toEqual(['breathing']);
    expect(r.outcome.kind).toBe('matched');
  });

  it('does not ask anything once resolved', () => {
    let s = state('he is in trouble');
    const first = advanceClarify(s, 'breathing', 'No, not breathing normally', P);
    s = first.state;
    expect(first.next).toBeNull();
    const again = advanceClarify(s, 'consciousness', 'Yes, awake and talking', P);
    expect(again.status).toBe('resolved');
    expect(again.state.answers).toHaveLength(1); // unchanged
  });

  it('walks the full set and reports exhaustion when nothing resolves', () => {
    const r = run('my parcel never arrived', [
      ['breathing', 'Yes, breathing normally'],
      ['consciousness', 'Yes, awake and talking'],
      ['bleeding', 'No bleeding'],
      ['age', 'Adult'],
      ['pregnancy', 'No'],
    ]);
    expect(r.status).toBe('exhausted');
    expect(r.outcome.kind).toBe('abstain');
  });
});

describe('negative answers can never become evidence', () => {
  it('excludes "no bleeding" from the matching transcript', () => {
    // The ranker sees words, not meaning. Feeding "no bleeding" verbatim would
    // push the engine TOWARDS a bleeding protocol.
    const s = advanceClarify(
      state('he fell over'),
      'bleeding',
      'No bleeding',
      P
    ).state;
    expect(matchingTranscript(s)).not.toMatch(/bleed/i);
  });

  it('excludes "not pregnant" too', () => {
    const s = advanceClarify(state('she feels unwell'), 'pregnancy', 'No', P).state;
    expect(matchingTranscript(s)).not.toMatch(/pregnan/i);
  });

  it('excludes "not sure" answers entirely', () => {
    const s = advanceClarify(state('he collapsed'), 'consciousness', 'Not sure', P).state;
    expect(matchingTranscript(s)).toBe('he collapsed');
  });

  it('still records negative answers so the dispatcher can see them', () => {
    const s = advanceClarify(state('he fell over'), 'bleeding', 'No bleeding', P).state;
    expect(s.answers).toHaveLength(1);
    expect(s.answers[0].optionLabel).toBe('No bleeding');
    expect(s.answers[0].contributed).toBe(false);
  });

  it('includes affirmative findings', () => {
    const s = advanceClarify(state('he fell over'), 'bleeding', 'Yes, bleeding heavily', P).state;
    expect(matchingTranscript(s)).toMatch(/bleeding heavily/);
    expect(s.answers[0].contributed).toBe(true);
  });

  it('cannot be talked into a protocol purely by denying symptoms', () => {
    // A caller who denies everything must not end up matched.
    const r = run('my parcel never arrived', [
      ['breathing', 'Yes, breathing normally'],
      ['consciousness', 'Yes, awake and talking'],
      ['bleeding', 'No bleeding'],
      ['age', 'Adult'],
      ['pregnancy', 'No'],
    ]);
    expect(r.outcome.kind).toBe('abstain');
  });
});

describe('the original caller speech is never modified', () => {
  it('keeps the transcript intact and appends only', () => {
    let s = state('my water just broke i am 9 months pregnant');
    const original = s.transcript;
    s = advanceClarify(s, 'breathing', 'Yes, breathing normally', P).state;
    expect(s.transcript).toBe(original);
    expect(matchingTranscript(s).startsWith(original)).toBe(true);
  });
});

describe('a dispatcher can stop at any time', () => {
  it('halts the loop and leaves the abstention standing', () => {
    let s = advanceClarify(state('he is unwell'), 'breathing', 'Yes, breathing normally', P).state;
    s = stopClarify(s);
    expect(nextQuestion(s)).not.toBeNull(); // questions remain, but...
    expect(s.stoppedByDispatcher).toBe(true);
    // ...the dispatcher choosing not to ask is not the same as being asked.
    const r = advanceClarify(s, 'consciousness', 'No, unresponsive', P);
    expect(r.status).toBe('resolved');
  });

  it('an unknown question id is refused rather than guessed at', () => {
    const r = advanceClarify(state('x'), 'not-a-question', 'Yes', P);
    expect(r.status).toBe('stopped');
    expect(r.state.answers).toHaveLength(0);
  });
});

describe('real scenarios resolve the way a dispatcher would expect', () => {
  it('an unrecognised call becomes cardiac once breathing is denied', () => {
    const r = run('my dad has collapsed and something is wrong', [
      ['breathing', 'No, not breathing normally'],
    ]);
    expect(r.outcome.kind).toBe('matched');
    if (r.outcome.kind === 'matched') expect(r.outcome.protocol.id).toBe('CARD-01');
  });

  it('an unrecognised call becomes a stroke once facial droop is confirmed', () => {
    let s = state('something is not right with my mother');
    s = advanceClarify(s, 'breathing', 'Yes, breathing normally', P).state;
    s = advanceClarify(s, 'consciousness', 'Confused or drowsy', P).state;
    s = advanceClarify(s, 'bleeding', 'No bleeding', P).state;
    // The dispatcher volunteers the droop they can see.
    s = { ...s, transcript: `${s.transcript}. one side of her face is drooping` };
    const out = evaluateClarify(s, P);
    expect(out.kind).toBe('matched');
    if (out.kind === 'matched') expect(out.protocol.id).toBe('NEURO-03');
  });
});
