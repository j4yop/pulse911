import { describe, it, expect } from 'vitest';
import { routeTranscript } from '../engine/routing';

describe('emergency signals outrank phrasing', () => {
  it('treats a question about a collapse as an emergency', () => {
    // The cheapest way to break a triage system is to let it classify by
    // grammar instead of content. This must never be informational.
    const v = routeTranscript('what should I do if my father collapses?');
    expect(v.kind).toBe('emergency');
  });

  it('treats "is it normal to have chest pain" as an emergency', () => {
    // Contains an informational marker ("is it normal") AND a red-flag signal.
    // The signal has to win.
    const v = routeTranscript('is it normal to have chest pain?');
    expect(v.kind).toBe('emergency');
    expect(v.signal).toContain('chest pain');
  });

  it('treats a question about someone not breathing as an emergency', () => {
    expect(routeTranscript('what are the symptoms of someone not breathing?').kind).toBe('emergency');
  });

  it('treats an overdose question as an emergency', () => {
    expect(routeTranscript('how much would it take to overdose?').kind).toBe('emergency');
  });

  it('reports which signal forced the emergency route', () => {
    const v = routeTranscript('he is choking and cannot speak');
    expect(v.kind).toBe('emergency');
    expect(v.signal).toBeTruthy();
  });

  it('attaches a guidance family to an emergency so the UI can be specific', () => {
    const v = routeTranscript('the room is full of smoke and he is burned');
    expect(v.kind).toBe('emergency');
    expect(v.categoryId).toBe('cat-thermal');
  });
});

describe('general health questions are routed away from the emergency path', () => {
  const informational = [
    'is 120/80 a normal blood pressure reading',
    'what does that lab result mean',
    'can I take ibuprofen with my blood pressure tablets',
    'what are the side effects of this medication',
    'is it worth worrying about a mild headache',
    'how much paracetamol is a normal adult dose',
    'what is the normal range for resting heart rate',
  ];

  for (const q of informational) {
    it(`routes "${q}" to informational`, () => {
      const v = routeTranscript(q);
      expect(v.kind).toBe('informational');
      expect(v.signpost).toBeTruthy();
    });
  }

  it('never returns an emergency card for a routine question', () => {
    // The bug being fixed: a routine question used to produce an amber
    // "call 911 now" screen.
    const v = routeTranscript('is 120/80 a normal blood pressure reading');
    expect(v.categoryId).toBeNull();
    expect(v.signal).toBeNull();
  });
});

describe('unclear input defaults to the emergency path', () => {
  it('does not let an unrecognised phrase be treated as casual', () => {
    expect(routeTranscript('my parcel never arrived').kind).toBe('emergency');
  });

  it('defaults to emergency for a fragment with no markers at all', () => {
    expect(routeTranscript('she is on the floor').kind).toBe('emergency');
  });

  it('is case and punctuation insensitive', () => {
    expect(routeTranscript('HE IS CHOKING!!!').kind).toBe('emergency');
  });
});
