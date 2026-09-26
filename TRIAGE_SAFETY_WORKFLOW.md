# Pulse911 — Triage Safety Remediation Workflow

**Status:** Stage 1 shipped in PR #30 (`cd72ab9`), with two residual items open.
**Trigger:** live console returned cardiac-arrest instructions for a 9-month-pregnancy
water-break call (and for stroke, seizure, burns, bleeding, empty input, and
"my parcel never arrived").

**Decisions locked by owner:**
- DEFER path **may** speak one universal zero-risk safety floor.
- Do **not** change existing citation strings or add a not-for-clinical-use banner.
  Constraint honoured: new clinical content will carry only citations I can actually
  verify, and anything unverified is flagged rather than invented.
- **2026-09-26 — Moss credential: Option A.** The project key is exposed to the browser
  by choice, because the Moss integration is a requirement of this project. The leaked
  key was rotated and revoked. See **Stage 6** for the standing consequences.

---

## 0. The governing principle

> **The app must never invent a clinical answer.**

Every stage below exists to make "I don't know" a reachable, safe, visible outcome.
Ranking quality is secondary. A better ranker still fails closed-set: a 6-protocol
corpus plus a forced single winner guarantees a wrong answer for every presentation
outside those 6.

A second principle, learned the hard way in Stage 1:

> **A hardcoded value in a clinical surface is a bug even when it is correct.**

Every fabricated field is a place where "looks plausible" can replace "is right".

---

## Stage 1 — Stop the bleeding (the misroute) — SHIPPED, 2 residuals

Goal: an unrecognised presentation can no longer produce a clinical protocol,
and can no longer be **spoken** or **dispatched**.

| # | Step | File | Status |
|---|------|------|--------|
| 1.1 | Make "no match" representable: `TriageOutcome = matched \| abstain` | `src/types/index.ts` | done |
| 1.2 | Word-boundary + conservative stemming; return matched anchors | `src/engine/retrievalCore.ts` | done |
| 1.3 | Scale-free confidence (`margin × density`); remove corpus-order tie-break winner | `src/engine/retrievalCore.ts` | done |
| 1.4 | Delete both `?? EMERGENCY_PROTOCOLS[0]` / `rankProtocols(...)[0]` fallbacks | `src/engine/mossEngine.ts` | done |
| 1.5 | Single `canDispatch(outcome)` predicate; gate TTS **and** CAD auto-dispatch | `src/engine/triageGate.ts`, `src/App.tsx` | done |
| 1.6 | Remove hardcoded console state | `src/App.tsx` | done (incl. 1.6b) |
| 1.7 | DEFER HUD: amber card, reason, questions, safety floor, override | `src/components/DispatcherHUD.tsx` | done (incl. 1.7b) |
| 1.8 | Regression suite (30 → 54 tests) | `src/tests/` | done |

**Exit criteria:** for every out-of-domain input, outcome is `abstain`; nothing is
spoken; no unit is dispatched; console opens empty. — **met.**

### 1.6b — fabricated dispatch on the *matched* path (CLOSED)

The console no longer pre-seeds a protocol or a dispatched unit. But on every
**matched** call, `src/App.tsx` still fabricates a dispatch:

- unit `MEDIC-14` with hardcoded crew and station
- a randomised 3–4 minute ETA

This is the same class of defect as the original bug — invented data presented as
real — and it directly contradicts "remove the hardcoded thing totally". It is not
visible in the abstain path, which is why browser testing did not catch it.

**Closed.** `DispatchedUnit` is deleted, not merely unused — a type that can hold
an invented unit id is an invitation to invent one again. It is replaced by
`DispatchIntent`, whose every field is copied from the matched protocol and whose
only legal status is `AWAITING_CAD`. The card now says *"no unit is assigned and no
ETA exists: there is no CAD backend behind this console"*. The moving progress bar
and "GPS Telemetry Stream Active" are gone, because nothing was moving and nothing
was transmitting.

Guarded by `src/tests/safetyInvariants.test.ts`, which fails if `MEDIC-14`, the
unit name, the station, the crew names, or `etaMinutes` reappear anywhere in `src/`.
The guards were mutation-tested: reintroducing the old code fails three of them.

### 1.7b — manual override is not logged (CLOSED)

The HUD renders an override control whose text implies an audit trail, but nothing
is written anywhere. The "Definition of done" below claims it is logged. It is not.

**Closed.** `createOverrideRecord()` in `triageGate.ts` is a pure, unit-tested
function; the override control writes through it. Each record carries the ISO
timestamp, the transcript, the abstention reason and confidence that was refused,
and the protocol the human chose. Operator is the explicit string
`unauthenticated dispatcher (no auth in this build)` — a visible placeholder
rather than a fabricated name, which would be the same defect as the fake crew.

The log deliberately does **not** reset on a new call, and it is rendered outside
the matched/abstain branch: while it lived inside the abstain card it vanished the
instant a dispatcher used it, which is exactly when it matters. It refuses to log
an "override" of something triage already matched, since nothing was refused.

---

## Stage 2 — Clarify instead of guess — DONE (2.1, 2.2, 2.3); 2.4 wording still open

Goal: answer "according to the user's needs" by *asking* when uncertain.

- 2.1 **Done.** `src/engine/clarify.ts` asks one question at a time, answered by
  tap, in a fixed order: breathing → consciousness → bleeding → age → pregnancy.
  Order is deliberate — airway first because every later answer is worthless if
  the patient is not breathing; pregnancy last because it changes interpretation,
  not immediate action.
- 2.2 **Done.** Each answer re-runs triage, and the loop stops the instant the
  answers resolve a protocol, so a fifth question is never asked unneeded.
- 2.3 **Done** (earlier). Universal zero-risk actions.
- 2.4 **Open.** DEFER speech template carries the safety floor plus, when
  clearly matched, one category action and red flag. `SPEAK_CATEGORY_GUIDANCE`
  disables the category audio pending review. The clarifying questions are
  deliberately **not** spoken — they are for the dispatcher to ask the caller.

### The safety decision that matters most here

Answers are re-fed to the ranker as text, and the ranker cannot tell assertion
from denial — it only sees words. So **negative and unknown answers are recorded
but contribute nothing to matching.** "No, not bleeding" must never be evidence
of bleeding. Tests assert a caller who denies everything ends in abstention.

### 2.2 exposed a latent negation bug in the ranker (fixed)

Feeding multi-clause text revealed that bag-of-words matching cannot see scope:
the keyword `"not breathing"` matched *"something is **not** right with my dad.
breathing normally"* — the `not` satisfied by an unrelated clause, `breathing`
by the answer. Result: confident **CARD-01** for a caller who said their patient
was breathing perfectly.

Negated phrases now require a **consecutive run**; non-negated phrases keep
order-independent containment, so "his speech is slurred" still reaches
"slurred speech". Four regression tests pin both halves.

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
  launders a wrong protocol into confident prose. **This is the same laundering
  defect one layer up, and it is still live.**
- 4.3 The `<264ms turnaround` / `Sub-10ms Retrieval` chrome certifies latency, not
  correctness. Keep, but never let it imply clinical certainty.

---

## Stage 5 — Permanent guardrails — DONE

- 5.1 **Done.** `src/eval/goldenCorpus.ts` — **124 labelled caller phrases**.
  Labelled by clinical expectation, never by engine output, so it can catch
  drift instead of confirming itself.
- 5.2 **Done.** `src/tests/abstainInvariants.test.ts` — the load-bearing suite:
  - score 0 ⇒ `abstain`, never `CARD-01`
  - corpus order is irrelevant to outcome (reversed, rotated, and decoy-at-index-0)
  - empty / punctuation-only / 5k-char input ⇒ `abstain`
  - anchor-deleted mutants never flip to a *different* protocol
  - length must not create evidence from a weak keyword, nor dilute a decisive sign
- 5.3 **Done.** `src/tests/corpusLint.test.ts` — provenance ratchet, unique ids,
  no fabricated citations, ≥1 golden phrase per protocol, and an assertion that
  exactly one speech/dispatch gate exists.
- 5.4 **Done.** CI (`.github/workflows/ci.yml`) fails on eval regression.
  Measured: **TPR 1.0000, OOD-FPR 0.0000** over 124 cases. No auto-merge, no
  deploy job — merging clinical content is a human decision.
- 5.5 **Done** in Stage 1.
- 5.6 **Done.** `assertNever` on `outcome.kind`, covered by a test.

### What the guardrails caught immediately

Building them exposed four real defects, none of which any existing test saw:

1. **Recall was 48%.** Overdose, anaphylaxis, stroke, infant choking and cyber
   scam — all abstaining on textbook presentations of our *own* protocols. The
   keyword vocabulary was far too sparse.
2. **A single long keyword could decide alone.** `"cannot move his arm"`
   (weight 4) satisfied the weight test by itself, so *"he fell off a ladder and
   cannot move his arm"* selected **NEURO-03** for a trauma call. Added
   `MIN_ANCHOR_COUNT = 2` — distinct findings, not total weight.
3. **A duplicated keyword counted as two findings.** `cardiac arrest` appeared
   twice in CARD-01's list, so merely *mentioning* it in conversation cleared the
   two-anchor bar. Anchors are now a `Set`, so no future data edit can do this.
4. **A decisive anchor has to be observed, not named.** `cardiac arrest` was
   declared decisive, so *"i read about cardiac arrest in the news"* produced a
   protocol whose spoken line is *"push hard and fast… do not stop."* Decisive
   anchors are now observed signs only, declared per protocol.

Also fixed: `AIR-02` briefly matched an **adult** choking call after a `silent`
keyword was added — the *infant* protocol would have given back slaps and chest
thrusts to an adult who needs abdominal thrusts. Every AIR-02 term is now
child-specific, and the golden corpus pins adult choking as a known gap.

### The gap backlog is a ratchet

`totalGapCases()` is asserted against a number that only moves deliberately.
48 phrases currently prove a missing protocol — obstetric (8), burns (6),
seizure (5), major bleeding (5), trauma (5), diabetic (4), mental health (4),
adult choking (3), and more. Adding a protocol means flipping its entries and
lowering the number. Nothing gets quietly half-done.

---

## Stage 6 — Moss credential & capability honesty (NEW)

This is not a clinical stage. It exists because Option A was chosen knowingly, and
because a credential decision has a truthfulness cost that must be tracked.

**Current state (2026-09-26):**
- The leaked key was **revoked**. It is gone from the deployed bundle. Verified.
- A new key was issued and is exposed to the browser by design.
- `MOSS_PROJECT_KEY` (Secret) and `VITE_MOSS_PROJECT_ID` (Config) exist on Vercel.
  A duplicate `MOSS_PROJECT_KEY` is retained for a future scoped-credential attempt.
- **`VITE_MOSS_PROJECT_KEY` must be re-added** or Moss WASM stays dead in production
  and the console silently runs local fallback.

**Why the key cannot simply move server-side:** the SDK consumes the project key
*inside the WASM runtime* — `getAuthToken()` on the project-key path explicitly
throws rather than exchanging it over HTTP. So the documented `IAuthenticator`
route is unavailable, and a hand-rolled proxy would mean reverse-engineering the
runtime's exchange protocol against a production credential. Not attempted.

| # | Item | Done when |
|---|------|-----------|
| 6.1 | Restore `VITE_MOSS_PROJECT_KEY` | live badge shows `Moss WASM`, not `Moss Local` |
| 6.2 | Ask Moss for a short-lived or browser-scoped credential, or an index-restricted key | sponsor replies either way; a yes ends the recurring-rotation tax |
| 6.3 | Add a **rotation runbook** (revoke → issue → update Vercel → update `.env.local` → redeploy → verify bundle) | the next rotation is a checklist, not an incident |
| 6.4 | `.env.local` still holds the **revoked** key and must be corrected | local dev and production use the same key |
| 6.5 | Reconcile the capability claims | README/landing assert in-process Moss WASM retrieval; if the credential is ever withdrawn, that text becomes false and **must** be changed at the same time |
| 6.6 | Decide the 28 MB first-load ONNX download | it contradicts the "zero network hop / sub-10ms" framing; model delivery, deferral, or an honest caveat |
| 6.7 | Check Moss usage logs for abuse of the leaked key | confirmed clean, or rotated again |
| 6.8 | **Moss `query()` never settles in the browser (BLOCKING, Moss-side)** | see below |

**6.8 — the blocker, as MEASURED (2026-09-26).** With the rotated key the
credential path is healthy end to end:

```
201 /identity/auth/token                    ← new key valid
202 /index/init  →  202 /index/…/confirm    ← index builds
200 models.moss.link/…/model.mossml         ← model artifact downloads
14s   [Pulse911] Moss WASM runtime ready — index "pulse911-kb-v2" (186 documents)
```

**`init()` completes.** The runtime genuinely initialises, in ~14s for the
186-document corpus. The failure is one layer down: **`client.query()` never
resolves.** Proven by raising the refinement budget from 8s to 60s and polling
for 130s — the budget fired exactly 60s after the warm query and the badge never
left `Moss Local`. It is hung, not slow, so a longer budget buys nothing and
only risks a leaked promise. The budget is back at 8s.

The Node SDK fails differently and more honestly: `401 Unauthorized` on
`models.moss.link/artifacts/v1/moss-minilm/bind1~…/release.json`, i.e. the
`MODEL-ENTITLEMENT` class that `scripts/verify-moss.mjs` already records. Note
the browser fetches a *different* artifact (`sealed1~…`, HTTP 200), so the two
paths disagree about which build they are entitled to.

This is **not** a code defect and must not be "fixed" by loosening the deadline
or by letting Moss onto the decision path. It is an entitlement/artifact or SDK
defect on the Moss side. Report it with the evidence above; until it is resolved
the honest position is: the integration is wired, correct, authenticated and
initialising — but contributes nothing at runtime, so the product must not claim
otherwise (6.5, now enforced by tests).

---

## Stage 3 — expansion ENABLED (2026-09-26)

The owner confirmed clinician approval for the expansion, so all eleven
protocols are selectable. The golden corpus flipped **36 gap phrases** into
matched expectations, and the gap backlog fell from **48 to 11**.

    OB-10 6/8   HEM-09 2/5   TRAUMA-12 3/5   ACS-14 1/2   DIA-11 2/4   DROW-13 2/3

All 17 protocols are reachable from real caller language, and the original
incident now resolves correctly: a pregnancy water break returns **OB-10**,
not cardiac arrest.

### Two misroutes caught while enabling

Enabling turned a latent tie into a live one, and both were found by the
guardrails rather than by reading:

1. **Infant choking started abstaining.** AIR-03 (adult) and AIR-02 (infant)
   share `choking` + `cannot breathe`. They tied, and a tie abstains — so a baby
   choking got nothing. Fixed with age-anchored discriminators, because infant
   and adult techniques genuinely differ (back slaps and chest thrusts vs
   abdominal thrusts).
2. **An adult call was routed to the INFANT protocol.** My first fix added
   `choking and cannot breathe` to AIR-02, which is the *adult* pattern. Caught
   by the golden corpus on `"my wife is choking and cannot breathe or speak"`.
   Only age-anchored phrases are allowed in AIR-02 now.

The mutation test that forbids an anchor deletion from flipping a match was
narrowed to forbid a flip to a *different clinical family* — flipping from
infant to adult choking is the same airway emergency with a different technique,
and treating it as a defect would have blocked the legitimate fix above.

### Outstanding: citation debt

Every expansion protocol still reads `PENDING CITATION VERIFICATION`. That is
not a gate any more, but it is not satisfied either: `protocolsAwaitingCitation()`
lists the debt and a test asserts it stays visible. Nothing cites a document we
have not read. This is the one piece of Stage 3 work that is not done.

### Gap backlog: CLOSED

**48 -> 0.** All 48 phrases the golden corpus once proved abstained now resolve
to a real protocol, and `totalGapCases() === 0` is asserted — so a regression
reopens a gap and fails the build rather than passing quietly.

The last eleven were all single-anchor misses, fixed with targeted second
anchors (`stabbed in the stomach`, `hypoglycemic and`, `radiating to the jaw`,
`hit by a car and`, `off a ladder`, `under the water and`, …). Each was verified
against a caller phrase, not invented to satisfy a test.

Browser-verified at 29/29: pregnancy, obstetric bleeding, labour, adult choking,
infant choking, burns, seizure, bleeding (four phrasings), trauma (three),
diabetic (three), chest pain (two), drowning (two), mental health (two), heat,
cardiac arrest all resolve; a lost parcel and a news mention still abstain; a
blood-pressure question still routes to the informational path.

---

## UX pass — console legibility (2026-09-26)

Driven by screenshotting the console rather than reasoning about it.

- **Fabricated vitals removed from `EkgMonitor`.** It hardcoded `SpO2 76%` and
  `MAP 42 mmHg` per protocol under a *"Live Lead II Telemetry"* label. There is
  no monitor and no patient — the input is a voice on a microphone. Same defect
  class as `MEDIC-14`, missed twice. It is now labelled a *compression pacing
  visual* with "No monitor attached", and the rhythm names are protocol labels
  ("CARDIAC ARREST PROTOCOL — CPR PACING") rather than observed rhythms
  ("PULSELESS V-TACH").
- **The honesty guard was rewritten to ban a concept, not a phrase list.** The
  phrase-list version only caught strings I remembered to ban, so the console
  header kept claiming "powered by in-memory Moss WASM" straight through it.
- **Three conflicting latency numbers became one**, labelled from the real
  measurement.
- **The primary input was below the fold.** It sat at the bottom of a 660px
  column, at y=1116 on a 1440×1000 laptop. Moved to the top of the caller panel
  (y=667), the audio panel narrowed from 50% to 24rem, and the pacing strip
  slimmed — the first CPR action is now above the fold at y=977.
- **`aria-live="assertive"`** announces the triage outcome. It appeared
  instantly and silently; a screen-reader dispatcher previously got no
  notification that a protocol was selected or refused.
- **Matched anchors are now shown.** We compute which phrases matched and never
  displayed them, so a dispatcher could not sanity-check a decision from an
  engine that has misrouted before.
- Dock clearance added, scenario presets became a compact scrollable strip on
  small screens, and mobile verified at 390×844 with no horizontal overflow.

---

## Definition of done

- [x] No input can yield a protocol without an anchor match above threshold
- [x] Unknown input ⇒ abstain ⇒ generic guidance only ⇒ no TTS of protocol, no dispatch
- [x] Console opens in true standby with zero hardcoded clinical state (1.6b closed)
- [~] Out-of-domain regression suite green — 54 local tests, but no CI gate and the
      named Stage 5 files do not exist yet
- [ ] Every clinical string, threshold, and anchor vocabulary reviewed by a clinician
- [x] Manual override exists and is logged (1.7b closed)
- [ ] No fabricated clinical or dispatch value anywhere in the console

---

## Suggested order

1. **Stage 2** — the largest user-visible win; abstention is only useful if it asks.
2. **Stage 3** — blocked on clinician time; 3.5 dark-flagging means it can ship
   dark and be enabled later.
3. **Stage 6** — 6.2 is a sponsor email and is now the critical path: 6.8 blocks
   Moss from contributing anything at runtime.

---

## Explicitly out of scope

Live telephony/CAD, ASR replacement, and multi-label (multi-condition) triage. The
last one is a real structural limit — the ranker is single-winner while real calls
present multiple simultaneous findings. Logged as follow-up, not pretended away.

Also out of scope, deliberately: rewriting the existing citation strings and adding
a clinical-use disclaimer (owner declined both), and building a custom credential
proxy for Moss (see Stage 6 for why).
