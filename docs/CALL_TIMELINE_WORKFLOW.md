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

## The multi-turn corpus, and what it caught immediately

`src/eval/multiTurnCorpus.ts` + `src/tests/multiTurnCorpus.test.ts` — conversations
of two or more turns, replayed through the **same path the app uses**: build the
timeline, take the effective transcript, run the triage gate.

Labelled to what is clinically correct, never to what the engine currently does.
On the first run, **3 of 12 conversations failed**, and all three were real bugs:

### Bug A — a correction destroyed an unrelated critical finding

`sorry i misspoke that is my mother not my father` mentions no clinical finding,
but the old code withdrew the **whole previous turn** on any cue. So it also threw
away `not breathing` from the same call:

| | before | after |
|---|---|---|
| "my father collapsed and is not breathing" | CARD-01 | CARD-01 |
| "+ that is my mother not my father" | **abstain** | **CARD-01** |

This is the mirror of the stale-match bug and **more dangerous**, because the
screen then shows nothing wrong while someone is dying. Under-triage fails
silently; over-triage is at least visible.

Fixed by scoping withdrawal to the claims actually retracted, at clause level, so
`he is unresponsive and not breathing` keeps its breathing when only the
responsiveness is taken back.

### Bug B — corrections chain, and the chain was not followed

`... not my father` then `actually that was my cat` refers **past** the subject
correction, because the correction never changed the claim. Withdrawing only the
immediately preceding turn left the original `not breathing` alive, with cardiac
arrest on screen for a cat. The retraction now walks back over the correction
chain to the claim underneath.

### Bug C — our own audit line lied

`describeRetraction` said "was withdrawn" for every correction, including ones
that deliberately withdrew nothing. An audit line that overstates the change is
worse than none: the operator learns to ignore the ones that matter.

## The composition gap — found, and closed

The corpus calls `resolveTriageOutcome` — the deterministic local engine. The app
runs a longer sequence, and **three call sites in `App.tsx` were still passing the
RAW latest utterance instead of the effective transcript**:

| call site | consequence of the bug |
|---|---|
| `routeTranscript(text)` | a withdrawn emergency still routed as an emergency, because "actually that was my cat" carries no clinical words of its own |
| `speakableGuidanceScript(text)` | guidance spoken from a withdrawn finding |
| `refineWithMoss(text)` | Moss re-derived a protocol from words the caller had taken back |

Every existing test passed with those bugs present, because they all called
`resolveTriageOutcome` directly. **A corpus can only catch what it is wired to
see.** All three now use the effective transcript.

Verified headed, using a `data-testid` on the dispatch card rather than a text
search (an earlier loose locator matched an unrelated button and produced a false
reading):

| turn | dispatch card |
|---|---|
| "my father collapsed and is not breathing" | shown |
| "+ that is my mother not my father" | shown — emergency stands |
| "+ actually that was my cat" | **cleared** |

`src/tests/callComposition.test.ts` now runs the app's whole decision sequence per
conversation — route, resolve, present, permit — so this class of bug fails the
suite. It duplicates the call order rather than importing it; extracting the
decision into one shared function is the durable fix and is still open.

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
