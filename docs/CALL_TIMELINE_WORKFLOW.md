# Stage 7 — The call timeline: a conversation, not a turn-taking machine

Status: **shipped** (`src/engine/callTimeline.ts`, wired in #41)
Owner: engineering, pending clinical review of the predicate list

## Why this stage exists

The engine treated every utterance as the complete picture. Each one was triaged
in isolation and the result replaced the last, so **a caller could not change
their mind**. Reproduced in a browser before any of this was written:

| caller says | system did |
|---|---|
| "my father collapsed in the kitchen" | CARD-01, asks about breathing |
| "he is not breathing" | CARD-01 |
| "sorry i misspoke that is my mother not my father" | **reopened** the breathing question |
| **"actually he is breathing normally i was wrong"** | **still CARD-01** — retraction ignored |

A retraction of the single most important finding left a stale cardiac arrest on
screen with nothing indicating it was stale. In a tool whose premise is that the
operator trusts the screen, a stale critical match is worse than no match: it is
confidently wrong.

The interaction had also been designed as **turn-taking** — one description, one
question, one-word reply. Real callers talk continuously, backtrack, correct
themselves, change who they are describing, and contradict themselves. That is
normal, not an error to be discarded.

## The rule

**Later information supersedes earlier information, and the supersession is always
visible.** The timeline never silently edits history.

## What it does

1. **Records every turn** — spoken or typed, in order, with a monotonic sequence
   number rather than a clock so it is deterministic under test.
2. **Detects retraction** — a cue phrase (`sorry`, `actually`, `no wait`, `i
   was wrong`, `i misspoke`, `correction`, `scratch that`, `not him`, `i meant`,
   …) withdraws the immediately preceding turn.
3. **Detects contradiction** — the same predicate flips polarity between turns.
4. **Matches on the effective transcript** — everything said, minus what has been
   withdrawn. The newest statement wins.
5. **Says what changed** — a persistent `Call updated ×N` badge, hoverable for the
   full list, present for the whole call.

### A bug worth recording

Contradiction detection originally **skipped withdrawn utterances**. That looked
right and was exactly wrong: a retraction *is* the flip, so dropping the old
utterance deleted the evidence of the change and the most important event in the
call went unreported. Contradictions are now detected across the whole call. A
flip that happened is a historical fact whether or not we still act on it.

## Deliberate limits

- **It does not decide anything.** It produces the transcript that should be
  matched on plus the changes an operator must see. Deciding remains the triage
  gate's job.
- **Polarity tracking is small and blunt** — breathing, pulse, consciousness,
  bleeding, choking. These are the findings that change the protocol. A wide,
  clever grammar would be easier to fool, and every false positive tells the
  operator a real finding was withdrawn.
- **Negation is always read before assertion.** "not choking" contains
  "choking"; testing in the wrong order invents the opposite finding, and a later
  correction then reads as a contradiction of a lie. Pinned by a test.

## What is NOT solved here

- **The stale-protocol question is only partly handled.** The timeline fixes what
  we *match on*. It does not stop a protocol being displayed when the operator
  overrides, and the copilot can still disagree.
- **`DROW-13` outranks `CARD-01`** for "collapsed and not breathing" — unchanged
  and still flagged. That is clinical ranking, not engineering.
- **Accent, noise and crosstalk** are not modelled. Two overlapping speakers is
  out of scope for this stage.
- **The predicate list needs a clinician.** Five predicates is a starting point
  chosen for blast radius, not a clinical instrument.

## Verification

- `src/tests/callTimeline.test.ts` — 18 unit tests, including the exact
  three-turn sequence reproduced in the browser, polarity ordering, empty and
  hostile input, and determinism.
- `npm run verify:clarify-voice` — browser checks: the withdrawal is reported, it
  names what was withdrawn, and it **stays visible after later turns**. A
  withdrawal visible only while a question happens to be open is a withdrawal
  that can be missed.
- 246 unit tests, `tsc -b` and `vite build` clean.

## Next, in order

1. **Clinical review of the predicate list.** Add or remove findings. This is the
   gating item — everything below assumes the list is right.
2. **A protocol must not outlive its evidence.** If the operator overrides, or a
   later turn withdraws the finding that produced the match, the displayed
   protocol should degrade rather than linger. Only half-built.
3. **Speaker turns.** "He is fine — *she* is not breathing" is currently one
   blob. Tracking who is described is the next real gap.
4. **Retro-audit.** Replay the golden corpus as multi-turn conversations to catch
   regressions the single-turn corpus cannot see.

## Related: can we go past 17 protocols?

Answered separately, because the constraint is not code. See
**"On adding protocols"** at the foot of `TRIAGE_SAFETY_WORKFLOW.md`.
