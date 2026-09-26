import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createOverrideRecord, UNAUTHENTICATED_OPERATOR } from '../engine/triageGate';
import { EMERGENCY_PROTOCOLS } from '../engine/emergencyProtocols';
import type { TriageOutcome } from '../types';

/**
 * Every .ts/.tsx under src/, so these guards see the whole client surface.
 *
 * This file is excluded: it necessarily contains the very literals it forbids,
 * so a scanner that reads itself would always fail.
 */
function sourceFiles(dir = join(process.cwd(), 'src')): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    if (entry === 'safetyInvariants.test.ts') return [];
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

/**
 * Strip comments before scanning.
 *
 * The removal is documented in comments that necessarily quote what was
 * removed, and a guard that fails on its own documentation is a guard that
 * gets deleted. Only whole-line `//` comments and `/* *\/` blocks are stripped;
 * trailing comments are left alone so a literal hiding after code on the same
 * line is still caught.
 */
function stripComments(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
}

const ALL_SOURCES = sourceFiles().map((f) => ({
  file: f,
  text: stripComments(readFileSync(f, 'utf8')),
}));

/** Files that own the triage/dispatch decision, where invented data is fatal. */
const DECISION_FILES = ALL_SOURCES.filter((s) =>
  /App\.tsx$|types\/index\.ts$|triageGate\.ts$|mossEngine\.ts$|DispatcherHUD\.tsx$/.test(s.file)
);

/**
 * 1.6b — the console used to invent an entire ambulance on every matched call:
 * `MEDIC-14`, "Medic Engine 14 (ALS Paramedic Rescue)", "Station 4 • Downtown
 * Core", a named crew, and `Math.random()` for the ETA, all behind a "DISPATCHED"
 * badge. Same defect class as the misroute that started all this: invented data
 * presented as fact. These fail if any of it reappears.
 */
describe('no fabricated dispatch state', () => {
  const forbidden: Array<[string, string]> = [
    ['MEDIC-14', 'invented unit id'],
    ['Medic Engine 14', 'invented unit name'],
    ['Station 4', 'invented station'],
    ['R. Torres', 'invented crew name'],
    ['J. Vance', 'invented crew name'],
  ];

  for (const [needle, why] of forbidden) {
    it(`no source file contains "${needle}" (${why})`, () => {
      const hits = ALL_SOURCES.filter((s) => s.text.includes(needle)).map((s) => s.file);
      expect(hits).toEqual([]);
    });
  }

  it('no ETA field survives anywhere in the client', () => {
    const hits = ALL_SOURCES.filter((s) => /etaMinutes/.test(s.text)).map((s) => s.file);
    expect(hits).toEqual([]);
  });

  it('the decision path never invents data from a random number', () => {
    // Scoped to the triage/dispatch owners. Decorative components legitimately
    // use randomness for animation; inventing an ETA from it is not decorative.
    const hits = DECISION_FILES.filter((s) => /Math\.random\(/.test(s.text)).map((s) => s.file);
    expect(hits).toEqual([]);
  });

  it('the fabricated DispatchedUnit type is gone, not merely unused', () => {
    const hits = ALL_SOURCES.filter((s) => /DispatchedUnit/.test(s.text)).map((s) => s.file);
    expect(hits).toEqual([]);
  });

  it('dispatch intent cannot represent a dispatched or en-route unit', () => {
    const types = readFileSync(join(process.cwd(), 'src/types/index.ts'), 'utf8');
    const block = types.slice(types.indexOf('export interface DispatchIntent'));
    // Only AWAITING_CAD may exist as a status — no DISPATCHED/EN_ROUTE/ON_SCENE.
    expect(block.slice(0, block.indexOf('}'))).toContain("status: 'AWAITING_CAD'");
    expect(block.slice(0, block.indexOf('}'))).not.toMatch(/'DISPATCHED'|'EN_ROUTE'|'ON_SCENE'/);
  });
});

/**
 * 1.7b — the override control only flipped local React state while the UI copy
 * implied an audit trail. The record has to exist, be attributable, and refuse
 * to log an "override" of something triage already matched.
 */
describe('override audit trail', () => {
  const chosen = EMERGENCY_PROTOCOLS[0];
  const abstain: TriageOutcome = {
    kind: 'abstain',
    reason: 'low-confidence',
    confidence: 0.21,
    anchors: ['water broke'],
  };

  it('records what triage refused, what the human chose, and who', () => {
    const when = new Date('2026-09-26T10:11:12.000Z');
    const rec = createOverrideRecord({
      outcome: abstain,
      transcript: 'my water just broke i am 9 months pregnant',
      chosen,
      now: when,
      seq: 3,
    });

    expect(rec).not.toBeNull();
    expect(rec!.presentedReason).toBe('low-confidence');
    expect(rec!.presentedConfidence).toBe(0.21);
    expect(rec!.chosenProtocolId).toBe(chosen.id);
    expect(rec!.chosenProtocolCode).toBe(chosen.code);
    expect(rec!.transcript).toContain('9 months pregnant');
    expect(rec!.atIso).toBe('2026-09-26T10:11:12.000Z');
    expect(rec!.id).toContain('ovr_');
  });

  it('never claims an identity it cannot verify', () => {
    const rec = createOverrideRecord({ outcome: abstain, transcript: 'x', chosen });
    expect(rec!.operator).toBe(UNAUTHENTICATED_OPERATOR);
    expect(rec!.operator).toMatch(/unauthenticated/i);
  });

  it('refuses to log an override of something triage already matched', () => {
    const matched: TriageOutcome = {
      kind: 'matched',
      protocol: chosen,
      confidence: 0.98,
      margin: 0.4,
      anchors: ['not breathing'],
    };
    // Logging this as an "override" would corrupt the trail: nothing was refused.
    expect(createOverrideRecord({ outcome: matched, transcript: 'x', chosen })).toBeNull();
    expect(createOverrideRecord({ outcome: null, transcript: 'x', chosen })).toBeNull();
  });

  it('generates distinct ids for overrides in the same millisecond', () => {
    const when = new Date('2026-09-26T10:11:12.000Z');
    const a = createOverrideRecord({ outcome: abstain, transcript: 'x', chosen, now: when, seq: 0 });
    const b = createOverrideRecord({ outcome: abstain, transcript: 'x', chosen, now: when, seq: 1 });
    expect(a!.id).not.toBe(b!.id);
  });
});

/**
 * 1.6b, part two: the live-call telemetry was still fabricated after the dispatch
 * card was fixed. `callerLocation` carried "Triangulating Cell Tower GPS",
 * "Metro Dispatch Sector 4" and hardcoded San Francisco coordinates, rendered
 * under a map-pin icon — with no geolocation anywhere in the app. And
 * `reportedVitals` ("VAD MONITORED", "TRIAGED IN REAL TIME") was written on
 * every call and never read by anything, which is fabrication with no purpose.
 *
 * Same rule as the ambulance: a field that must be invented is a field that
 * should be absent.
 */
describe('the live call fabricates no caller telemetry', () => {
  // Comments stripped, so the comment that documents the removal does not
  // itself trip the guard that enforces it.
  const APP = stripComments(readFileSync(join(process.cwd(), 'src/App.tsx'), 'utf8'));

  it('invents no coordinates for a live call', () => {
    for (const needle of ['37.7749', '122.4194', 'Triangulating', 'Cell Tower']) {
      expect(APP.includes(needle), `App.tsx still invents "${needle}"`).toBe(false);
    }
  });

  it('invents no sector or vitals for a live call', () => {
    for (const needle of ['Metro Dispatch Sector', 'VAD MONITORED', 'TRIAGED IN REAL TIME']) {
      expect(APP.includes(needle), `App.tsx still invents "${needle}"`).toBe(false);
    }
  });

  it('does not claim the live path is routed through Moss', () => {
    // Moss corroboration is a background enhancement that currently never
    // succeeds (see workflow 6.8). Saying the call is "routed via Moss" is a
    // capability claim we cannot make.
    expect(APP).not.toMatch(/routed via Moss/);
  });

  it('leaves callerLocation and reportedVitals optional on the scenario type', () => {
    const types = readFileSync(join(process.cwd(), 'src/types/index.ts'), 'utf8');
    expect(types).toMatch(/callerLocation\?:/);
    expect(types).toMatch(/reportedVitals\?:/);
  });
});

/**
 * Capability claims must be true.
 *
 * A marketing surface that asserts a capability the build does not have is the
 * same defect as a fabricated dispatch card: invented data presented as fact,
 * except it reaches judges and sponsors instead of callers. The expensive one
 * here was "Test ... sub-10ms Moss WASM protocol retrieval" — an instruction to
 * try the one thing that does not work, because `client.query()` never settles
 * (workflow 6.8).
 */
describe('no capability claim outruns the build', () => {
  const UI = ['Navbar', 'LandingView', 'ConsoleView', 'DispatcherHUD', 'CallerPanel', 'PRDView']
    .map((f) => stripComments(readFileSync(join(process.cwd(), `src/components/${f}.tsx`), 'utf8')))
    .join('\n');

  it('does not attribute protocol retrieval to the Moss runtime', () => {
    // The retrieval that actually runs is the deterministic in-browser matcher.
    for (const claim of [
      'Moss semantic retrieval',
      'Moss WASM protocol retrieval',
      'in-process semantic protocol retrieval',
      'Moss vector',
    ]) {
      expect(UI.includes(claim), `UI still claims "${claim}"`).toBe(false);
    }
  });

  it('does not present a fixed latency number as a measurement', () => {
    // "<264ms" was hardcoded in the spoken-instruction badge.
    expect(UI).not.toMatch(/Turnaround:?\s*&lt;\s*264ms/);
    expect(UI).not.toMatch(/Turnaround:?\s*<\s*264ms/);
  });

  it('shows a real measurement instead', () => {
    const panel = stripComments(readFileSync(join(process.cwd(), 'src/components/CallerPanel.tsx'), 'utf8'));
    expect(panel).toMatch(/retrievalLatencyMs/);
    expect(panel).toMatch(/measured/);
  });

  it('does not advertise a benchmark number for a runtime that hangs', () => {
    expect(UI).not.toMatch(/Moss WASM \(4ms\)/);
    expect(UI).not.toMatch(/badge: '3\.8ms'/);
  });
});

/**
 * Moss is wired, authenticated and initialising — but contributes nothing.
 *
 * Measured (2026-09-26, workflow 6.8): `init()` completes in ~14s for the
 * 186-document corpus, and `client.query()` then never resolves. Proven by
 * raising the budget to 60s and polling 130s: the budget fired on time and the
 * engine label never left "Moss Local".
 *
 * The budget is a leak guard, not a performance knob, so it stays tight. This
 * test exists to stop someone "fixing" 6.8 by raising it.
 */
describe('the Moss deadline stays tight', () => {
  it('is 8s, not loosened to paper over the hang', () => {
    const src = readFileSync(join(process.cwd(), 'src/engine/mossEngine.ts'), 'utf8');
    const m = src.match(/MOSS_REFINEMENT_BUDGET_MS\s*=\s*(\d+)/);
    expect(m, 'budget constant not found').toBeTruthy();
    expect(Number(m![1])).toBe(8000);
  });

  it('still refuses to let Moss re-decide, whatever the runtime does', () => {
    const src = readFileSync(join(process.cwd(), 'src/engine/mossEngine.ts'), 'utf8');
    // The guard that a guidance document cannot become a protocol.
    expect(src).toMatch(/kind === 'protocol'/);
    // And that a non-protocol hit returns nothing rather than an outcome.
    expect(src).toMatch(/if \(!protocol\) \{/);
  });
});
