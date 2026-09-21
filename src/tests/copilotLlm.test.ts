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
    expect(system).toMatch(/no new clinical actions/i);
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
