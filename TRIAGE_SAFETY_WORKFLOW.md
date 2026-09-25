# Pulse911 — Triage Safety Remediation Workflow

**Status:** approved, in progress
**Trigger:** live console returned cardiac-arrest instructions for a 9-month-pregnancy
water-break call (and for stroke, seizure, burns, bleeding, empty input, and
"my parcel never arrived").

**Decisions locked by owner:**
- DEFER path **may** speak one universal zero-risk safety floor.
- Do **not** change existing citation strings or add a not-for-clinical-use banner.
  Constraint honoured: new clinical content will carry only citations I can actually
  verify, and anything unverified is flagged rather than invented.

---

## 0. The governing principle

> **The app must never invent a clinical answer.**

Every stage below exists to make "I don't know" a reachable, safe, visible outcome.
Ranking quality is secondary. A better ranker still fails closed-set: a 6-protocol
corpus plus a forced single winner guarantees a wrong answer for every presentation
outside those 6.

---

## Stage 1 — Stop the bleeding (the misroute) — DO NOW

Goal: an unrecognised presentation can no longer produce a clinical protocol,
and can no longer be **spoken** or **dispatched**.

| # | Step | File | Done when |
|---|------|------|-----------|
| 1.1 | Make "no match" representable: `TriageOutcome = matched \| abstain` | `src/types/index.ts` | `protocol` is no longer non-nullable; TS forces callers to narrow |
| 1.2 | Word-boundary + light stemming; return matched anchors | `src/engine/retrievalCore.ts` | "face drooping" hits "facial droop" |
| 1.3 | Scale-free confidence (`margin × density`); remove corpus-order tie-break winner | `src/engine/retrievalCore.ts` | score 0 can never win; exact ties abstain |
| 1.4 | Delete `?? EMERGENCY_PROTOCOLS[0]` fallback; apply the same gate to the Moss path with a per-engine normaliser | `src/engine/mossEngine.ts` | no code path fabricates a protocol |
| 1.5 | Single `canDispatch(outcome)` predicate; gate TTS **and** CAD auto-dispatch behind it | `src/engine/triageGate.ts`, `src/App.tsx` | abstain ⇒ no speech, no MEDIC-14 |
| 1.6 | **Remove hardcoded console state entirely** | `src/App.tsx` | no pre-seeded `INITIAL_QUERY_RESULT` (was CARD-01 @ score 1.0), no pre-dispatched `INITIAL_DISPATCHED_UNIT`; console opens in true CAD Standby |
| 1.7 | DEFER HUD: amber card, confidence, reason, clarifying questions, safety floor, manual override that is logged | `src/components/DispatcherHUD.tsx` | no `protocol.` deref can crash or lie |
| 1.8 | Regression suite | `src/tests/` | see Stage 5 gate |

**Exit criteria:** for every out-of-domain input, outcome is `abstain`; nothing is
spoken; no unit is dispatched; console opens empty.

---

## Stage 2 — Clarify instead of guess

Goal: answer "according to the user's needs" by *asking* when uncertain.

- 2.1 Clarifying-question script, asked one at a time, answered by voice or tap:
  breathing → consciousness → bleeding → age → pregnancy.
- 2.2 Re-run triage on each answer; allow the question set to terminate early.
- 2.3 Universal zero-risk actions (never wrong, always permitted):
  put phone on speaker · unlock the door · do not hang up · note when symptoms started.
- 2.4 DEFER speech template, containing the single safety floor:
  *"If they are unresponsive and not breathing normally, start chest compressions
  now."* — correct in the worst case, and the reason we do not go silent.

**Owner review required:** exact wording of every spoken string.

---

## Stage 3 — Coverage

Goal: recognise what we can, so abstention stays rare and useful.

- 3.1 Add, in priority order (lethal-if-missed × prevalence):
  obstetric (ruptured membranes / bleeding / labour) · **adult** choking
  (currently infant-only — the commonest choking call on earth gets back-slaps) ·
  seizure · major external bleeding · burns · drowning · hypoglycaemia · trauma.
- 3.2 Every new protocol carries `sourceUrl`, `publishedAt`, `reviewedBy`, `reviewedAt`.
- 3.3 `corpusLint` refuses to enable a protocol lacking those fields.
- 3.4 Move `CYBER-06` out of the clinical corpus into its own router — it is not a
  medical emergency, its keyword `'police'` makes "the police are coming" score a
  cyber scam, and it competes with cardiac arrest for unknown input.
- 3.5 New protocols ship **dark-flagged** (present, not auto-enabled) until reviewed.

**Owner + clinician review required.** Engineer-authored clinical content is not a
safety net; unflagged, it widens the harm surface.

---

## Stage 4 — Trust & signal

- 4.1 Show confidence honestly; binary SAFE/UNSAFE badge plus the number.
- 4.2 Gate `copilotLlm` so it cannot narrate a misroute — it currently grounds on the
  protocol and is instructed "never contradict the scripted instruction", which
  launders a wrong protocol into confident prose.
- 4.3 The `<264ms turnaround` / `Sub-10ms Retrieval` chrome certifies latency, not
  correctness. Keep, but never let it imply clinical certainty.

---

## Stage 5 — Permanent guardrails (stop this class of bug forever)

- 5.1 `goldenCorpus.test.ts` — ~120 labelled caller phrases → expected `kind` + protocol.
- 5.2 `abstainInvariants.test.ts` — **the load-bearing test**:
  - score 0 ⇒ `abstain`, never `CARD-01`
  - corpus order is irrelevant to outcome
  - empty / punctuation-only / 5k-char input ⇒ `abstain`
  - anchor-deleted mutants abstain and never flip to a *different* protocol
- 5.3 `corpusLint.test.ts` — citations/reviewer present; ≥1 golden phrase per protocol.
- 5.4 CI fails the build on eval regression (TPR ≥ 0.97, OOD-FPR ≤ 0.02).
- 5.5 Remove the existing test that **asserts the tie-break bug as desired behaviour**
  (`retrievalCore.test.ts:91`).
- 5.6 `assertNever` exhaustiveness on `outcome.kind`, so a new call site cannot speak
  or dispatch without the compiler asking.

---

## Definition of done

- [ ] No input can yield a protocol without an anchor match above threshold
- [ ] Unknown input ⇒ abstain ⇒ generic guidance only ⇒ no TTS of protocol, no dispatch
- [ ] Console opens in true standby with zero hardcoded clinical state
- [ ] Out-of-domain regression suite green in CI
- [ ] Every clinical string, threshold, and anchor vocabulary reviewed by a clinician
- [ ] Manual override exists and is logged

---

## Explicitly out of scope

Live telephony/CAD, ASR replacement, and multi-label (multi-condition) triage. The
last one is a real structural limit — the ranker is single-winner while real calls
present multiple simultaneous findings. Logged as follow-up, not pretended away.
