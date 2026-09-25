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
| 1.6 | Remove hardcoded console state | `src/App.tsx` | **partial — see 1.6b** |
| 1.7 | DEFER HUD: amber card, reason, questions, safety floor, override | `src/components/DispatcherHUD.tsx` | **partial — see 1.7b** |
| 1.8 | Regression suite (30 → 54 tests) | `src/tests/` | done |

**Exit criteria:** for every out-of-domain input, outcome is `abstain`; nothing is
spoken; no unit is dispatched; console opens empty. — **met.**

### 1.6b — fabricated dispatch on the *matched* path (OPEN)

The console no longer pre-seeds a protocol or a dispatched unit. But on every
**matched** call, `src/App.tsx` still fabricates a dispatch:

- unit `MEDIC-14` with hardcoded crew and station
- a randomised 3–4 minute ETA

This is the same class of defect as the original bug — invented data presented as
real — and it directly contradicts "remove the hardcoded thing totally". It is not
visible in the abstain path, which is why browser testing did not catch it.

**Done when:** matched calls show an explicit *awaiting real CAD backend* state with
no fabricated unit, crew, or ETA, and the ETA field is either sourced or absent.

### 1.7b — manual override is not logged (OPEN)

The HUD renders an override control whose text implies an audit trail, but nothing
is written anywhere. The "Definition of done" below claims it is logged. It is not.

**Done when:** an override appends a real record (timestamp, operator, presented
outcome, chosen protocol, reason) and is visible in the UI. Until then, the UI copy
must not imply a log that does not exist.

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
  launders a wrong protocol into confident prose. **This is the same laundering
  defect one layer up, and it is still live.**
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
  (`retrievalCore.test.ts:91`) — **done in Stage 1**.
- 5.6 `assertNever` exhaustiveness on `outcome.kind`, so a new call site cannot speak
  or dispatch without the compiler asking.

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

**6.8 — the blocker, as measured (2026-09-26).** With the rotated key the credential
path is healthy end to end:

```
201 /identity/auth/token                    ← new key valid
202 /index/init  →  202 /index/…/confirm    ← index builds
200 /index/pulse911-protocols-v1/url
200 models.moss.link/…/model.mossml         ← model artifact downloads
```

`init()` completes and logs `Moss WASM runtime ready`. But `client.query()` then
**never resolves** — it blew a 30s budget, and 8s is the shipped cap. The badge
therefore stays `Moss Local` and Moss corroborates nothing. The Node SDK fails
differently and more honestly: `401 Unauthorized` on
`models.moss.link/artifacts/v1/moss-minilm/bind1~…/release.json`, i.e. the
`MODEL-ENTITLEMENT` class that `scripts/verify-moss.mjs` already records.

This is **not** a code defect and must not be "fixed" by loosening the deadline or
by letting Moss onto the decision path. It is an entitlement/artifact problem on
the Moss side. Ask them to confirm `moss-minilm` entitlement for this project key.
Until it is resolved, the honest position is: the integration is wired, correct,
and authenticated, but contributes nothing at runtime — so the product must not
claim otherwise (see 6.5).

---

## Definition of done

- [x] No input can yield a protocol without an anchor match above threshold
- [x] Unknown input ⇒ abstain ⇒ generic guidance only ⇒ no TTS of protocol, no dispatch
- [~] Console opens in true standby with zero hardcoded clinical state — standby yes;
      **matched path still fabricates unit/crew/ETA (1.6b)**
- [~] Out-of-domain regression suite green — 54 local tests, but no CI gate and the
      named Stage 5 files do not exist yet
- [ ] Every clinical string, threshold, and anchor vocabulary reviewed by a clinician
- [~] Manual override exists and is logged — exists, **not logged (1.7b)**
- [ ] No fabricated clinical or dispatch value anywhere in the console

---

## Suggested order

1. **1.6b** — it is the same defect class as the bug we just fixed, and it is live.
2. **1.7b** — the UI currently implies an audit trail that does not exist.
3. **Stage 2** — the largest user-visible win; abstention is only useful if it asks.
4. **Stage 5** — before the corpus grows, not after.
5. **Stage 3** — blocked on clinician time; 3.5 dark-flagging means it can ship
   dark and be enabled later.
6. **Stage 6** — 6.1 immediately (Moss is currently broken in production);
   6.2 is a sponsor email, not engineering.

---

## Explicitly out of scope

Live telephony/CAD, ASR replacement, and multi-label (multi-condition) triage. The
last one is a real structural limit — the ranker is single-winner while real calls
present multiple simultaneous findings. Logged as follow-up, not pretended away.

Also out of scope, deliberately: rewriting the existing citation strings and adding
a clinical-use disclaimer (owner declined both), and building a custom credential
proxy for Moss (see Stage 6 for why).
