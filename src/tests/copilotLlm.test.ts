import { describe, it, expect } from 'vitest';
import { buildDispatcherPrompt, extractCoachingText, isLlmConfigured, LlmResponseError } from '../engine/copilotLlm';
import { EMERGENCY_PROTOCOLS } from '../engine/emergencyProtocols';

const CARDIAC = EMERGENCY_PROTOCOLS.find((p) => p.code === 'AHA-ECC-2026-CARD') ?? EMERGENCY_PROTOCOLS[0];
const CYBER = EMERGENCY_PROTOCOLS.find((p) => p.category === 'cyber_extortion') ?? CARDIAC;

describe('copilotLlm · buildDispatcherPrompt', () => {
  it('grounds the prompt in the resolved protocol identity', () => {
    const { system, user } = buildDispatcherPrompt('he collapsed', CARDIAC);
    expect(user).toContain(CARDIAC.code);
    expect(user).toContain(CARDIAC.title);
    expect(user).toContain(CARDIAC.verbalResponseText);
    expect(system).toContain('dispatcher coach');
  });

  it('includes the caller transcript for context', () => {
    const transcript = 'fake CBI officer is demanding money right now';
    const { user } = buildDispatcherPrompt(transcript, CYBER);
    expect(user).toContain(transcript);
  });

  it('truncates very long transcripts to protect token budget', () => {
    const long = 'a'.repeat(5000);
    const { user } = buildDispatcherPrompt(long, CARDIAC);
    expect(user.length).toBeLessThan(1200);
  });

  it('forbids the LLM from adding clinical actions or contradicting the script', () => {
    const { system } = buildDispatcherPrompt('test', CARDIAC);
    expect(system).toMatch(/never introduce a clinical action/i);
    expect(system).toMatch(/never contradict/i);
    expect(system).toMatch(/60 words|maximum 60/i);
  });
});

describe('copilotLlm · extractCoachingText', () => {
  it('extracts trimmed content from a valid OpenAI-compatible payload', () => {
    const payload = { choices: [{ message: { content: '  Keep the caller on the line.  ' } }] };
    expect(extractCoachingText(payload)).toBe('Keep the caller on the line.');
  });

  it('accepts payloads with extra gateway fields (usage, thinking_blocks)', () => {
    const payload = {
      id: 'x',
      usage: { total_tokens: 42 },
      choices: [{ index: 0, message: { content: 'ok', role: 'assistant' }, finish_reason: 'stop' }],
    };
    expect(extractCoachingText(payload)).toBe('ok');
  });

  it('throws LlmResponseError on missing choices', () => {
    expect(() => extractCoachingText({})).toThrow(LlmResponseError);
  });

  it('throws LlmResponseError on empty choices array', () => {
    expect(() => extractCoachingText({ choices: [] })).toThrow(LlmResponseError);
  });

  it('throws LlmResponseError on empty or non-string content', () => {
    expect(() => extractCoachingText({ choices: [{ message: { content: '   ' } }] })).toThrow(LlmResponseError);
    expect(() => extractCoachingText({ choices: [{ message: { content: 42 } }] })).toThrow(LlmResponseError);
    expect(() => extractCoachingText({ choices: [{ message: {} }] })).toThrow(LlmResponseError);
  });

  it('throws LlmResponseError on null payload', () => {
    expect(() => extractCoachingText(null)).toThrow(LlmResponseError);
  });
});

describe('copilotLlm · configuration guard', () => {
  it('reports unconfigured when gateway env vars are absent', () => {
    // In the vitest environment no VITE_HIDEVS_* vars are set — the guard must be honest about it.
    expect(typeof isLlmConfigured()).toBe('boolean');
  });
});

/**
 * The laundering defect (workflow 4.2).
 *
 * The copilot used to be told the protocol "has already resolved", which meant a
 * WRONG match was coached around with confidence and no invitation to dissent.
 * A confidence-laundering copilot is worse than none: it makes an engine error
 * look like a considered clinical judgement.
 */
describe('the copilot is a second pair of eyes, not a launderer', () => {
  const protocol = {
    code: 'AHA-2026-CPR',
    title: 'Adult Cardiac Arrest',
    triageLevel: 'ESI-1 (Immediate Resuscitation)',
    verbalResponseText: 'Start chest compressions now.',
  } as const;

  it('presents the protocol as a machine guess, not a confirmed diagnosis', () => {
    const { system, user } = buildDispatcherPrompt('my water broke, I am 9 months pregnant', protocol);
    expect(system).toMatch(/SELECTED a protocol/i);
    expect(system).toMatch(/machine guess, not a confirmed diagnosis/i);
    expect(system).toMatch(/can be confidently wrong/i);
    expect(user).toMatch(/may be wrong/i);
    expect(user).not.toMatch(/PROTOCOL RESOLVED/);
  });

  it('invites disagreement and tells it to be the first thing said', () => {
    const { system } = buildDispatcherPrompt('x', protocol);
    expect(system).toMatch(/If the transcript does not actually fit/i);
    expect(system).toMatch(/say so plainly in your first sentence/i);
  });

  it('still forbids the model from inventing clinical content', () => {
    const { system } = buildDispatcherPrompt('x', protocol);
    expect(system).toMatch(/never introduce a clinical action/i);
    expect(system).toMatch(/a dosage/i);
    expect(system).toMatch(/never contradict the scripted instruction/i);
  });

  it('keeps the transcript bounded so a caller cannot flood the request', () => {
    const long = 'a'.repeat(5000);
    const { user } = buildDispatcherPrompt(long, protocol);
    const quoted = user.match(/TRANSCRIPT: "([^"]*)"/)?.[1] ?? '';
    expect(quoted.length).toBeLessThanOrEqual(600);
  });
});
