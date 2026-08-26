# CWC compliance checklist

Every rule from the authoritative Senate RelaxNG schema and George Dollery's
SAA onboarding call, mapped to where we handle it. **Build to the Senate
(stricter) rules; the House accepts the same payload.** Legend: ✅ done in this
module · 🟡 pending (upstream product/recipient work) · 📋 process step.

## Hard schema rules — reject the message if wrong (`xml.ts`)

- ✅ **Prefix ∈ {Mr., Mrs., Miss, Ms., Dr.}** — validated + unit-tested. UI must also constrain the picker to these five.
- ✅ **Office code = the seat, not the person** (static). Senate `S[A-Z]{2}0[1-3]`, House `H[A-Z]{2}\d{2}`, chamber-checked.
- ✅ **DeliveryId** = 32-char alphanumeric GUID; **DeliveryDate** = YYYYMMDD.
- ✅ **DeliveryAgent** = exact company legal name (`CWC_DELIVERY_AGENT` = `My Democracy LLC`) — Senate validates against the access application.
- ✅ **≥1 LibraryOfCongressTopic** from the Senate 32-topic list (not the House's newer list; count verified byte-for-byte against the RNG in the 2026-08-26 audit).
- ✅ **Subject** 6–500 chars; **OrganizationStatement/ConstituentMessage** 6–10,000, at least one present.
- ✅ **Bill type abbreviations** transcribed literally from the schema (incl. the `H.Con.Res` no-trailing-dot quirk); **ProOrCon** = Pro/Con.
- ✅ **Phone** normalized to `XXX-XXX-XXXX`; **Zip** 5-digit or ZIP+4; **State** ∈ valid code set; **Email** pattern-checked.

## George's content recommendations — "deal-breakers" for office trust

- ✅ **Every XML tag on its own line** (offices read raw XML in their CRM) — enforced + tested.
- ✅ **Campaign ID groups by specific subtopic/bill.** "Health / Medicare" ≠ "Health / vaccine policy" = different campaigns (`campaign-id.ts`, SHA-256). The key derives from the campaign row's **stable slug/id** (`campaignRef`) — free text throws, so one weigh-in can never fragment into several CWC campaigns from rephrased labels.
- ✅ **Bill referenced → include ProOrCon, and split pro vs con into separate campaigns** — stance is part of the campaign-id key + emitted as `<ProOrCon>`.
- ✅ **AI-personalized text → `ConstituentMessage`; untouched template → `OrganizationStatement`.** Both supported; be consistent.
- ✅ **Do NOT repeat the constituent's name/mailing address in the message body/closing** (breaks the offices' ~80%-similarity grouping). Two layers at render (`buildCwcXml`): `stripSignatureBlock` (bounded trailing-block cut, CRLF-normalized, closing+name-on-one-line and dash sign-offs) then **value-aware `redactConstituentPii`** — drops whole lines matching the constituent's OWN name/address/city-state-zip anywhere in the body (top-of-letter blocks included). The pre-send gate refuses what redaction can't fix safely: surviving signature blocks, **inline** PII ("My name is Jane Doe…"), and bodies that are ONLY a signature (nothing left after stripping). Every audit defeat case is a regression test.
- ✅ **Ask the constituent pro/con when a bill is referenced.** Enforced by the pre-send gate `assertCwcSendable` (`content.ts`): a bill reference without `message.stance` refuses to send. (Weigh-ins already capture stance; the contact flow must pass it through — the gate makes forgetting impossible.)
- ✅ **Only send from real constituents of that office.** `verifyConstituentForOffice` (`verify.ts`) re-geocodes the delivery's own constituent address and requires it to produce the target seat — **enforced inside `sendCwcDelivery`, MANDATORY in production (no opt-out)**, not caller discipline. `offices.ts` resolves office codes deterministically and refuses to guess. REMAINING RISK (upstream): the House district must come from an accurate **ZIP+4 → district** lookup; at split-ZIP boundaries a 5-digit ZIP can map to the wrong district.
- ✅ **Don't send federal offices about state bills.** `assertCwcSendable` (`content.ts`) — **FAIL-CLOSED**: only an explicit `billLevel` of `'federal'` or `'none'` is sendable; `'state'`, `null`, and *omitted* all refuse. "We don't know" never defaults to "send it to Congress".

## Pre-send compliance gate (`content.ts` → `assertCwcSendable`) ✅ wired

One function every send path runs (in `send.ts`, the admin route, and the acceptance harness). Refuses when:
1. `billLevel` is not explicitly `'federal'` or `'none'` — state bills AND unknown levels fail closed;
2. a **federal bill** is referenced with **no ProOrCon stance**;
3. the body **still contains a signature block after strip+redact** (e.g. a closing followed by a P.S.);
4. the body carries the constituent's **name or street address inline** where line-level redaction can't remove it safely;
5. the body is **only** a signature block — nothing deliverable remains after stripping.

## Operational rules

- ✅ **Rate limit 5–10 msg/sec** — the authoritative limiter is the Postgres permit allocator (`rate-permit.ts`), claimed **inside `postHouse`/`postSenate`** so no path (including the raw exports) can bypass it, and it holds across concurrent serverless instances. Deep queues **defer with backpressure** (`RatePermitBackpressureError` → `retry-later`), never burst past the ceiling; refused claims don't inflate the queue (`p_max_wait_ms`). `sendBatch` spacing remains per-process courtesy pacing only.
- ✅ **Run Get Active Offices before campaigns; only send to listed offices** (Senate participation is voluntary, ~50/100). `getActiveOfficeCodesCached` (`send.ts`) caches the list ~12h with a force-refresh option; `sendCwcDelivery` refuses offices not on the list and returns a `router` fallback so the message goes out via webform/email instead. An **EMPTY list throws instead of caching** — an API/parse failure must not silently divert every send to the fallback for 12h.
- ✅ **SCWC maintenance windows** (Sun 12a–6a, Wed 5a–7a ET): `isInScwcMaintenanceWindow` (`constants.ts`); `sendBatch` refuses to start inside a window (House-only batches can override); `sendCwcDelivery` returns `retry-later`.
- ✅ **Idempotent retries — duplicates forbidden (House LoS A.12; Senate 409s a reused DeliveryId).** `cwc_deliveries` table + `delivery-log.ts`: the DeliveryId per (message × office × environment) is minted once and REUSED on retry, never regenerated.
- ✅ **Monitor 400/500-class responses (SOAPBox requirement).** Every outcome (http status, parsed `<Error>` list, **raw response body** 8KB-truncated, payload sha256) is recorded in `cwc_deliveries` (service-role only, RLS with no policies). A **429 keeps the row `pending`** and surfaces as `retry-later` — rate limiting is not a verdict on the message.
- ✅ **Proxy scoped to CWC only**, Node runtime, both static IPs whitelisted (`client.ts`, README). **FAIL-CLOSED egress**: production sends refuse to leave without `QUOTAGUARD_URL` (explicit `CWC_ALLOW_DIRECT_EGRESS=true` override for diagnostics only), and env-overridable endpoints are validated as `https` `house.gov`/`senate.gov` hosts (`assertCwcUrl`).
- ✅ **Senate acceptance harness** — `scripts/cwc-acceptance-run.ts`: ≥3 distinct campaigns (bill+Pro, same-bill+Con as a separate campaign id, no-bill) across ALL 100 test office codes (`SENATE_TEST_OFFICE_CODES`), each send through **`sendCwcDelivery` (the production path)**, logged to `cwc_deliveries`. Refuses to run without `CWC_ACCEPTANCE_CONFIRM=YES` + `CWC_ACCEPTANCE_ENV=test`; hardcoded to the test endpoint.
- 📋 **Notify `saacwc@saa.senate.gov` when test messages are ready for review** (Senate).
- 📋 **Separate test/prod endpoints + keys**; Senate test env accepts all 100 offices but keeps them in the sandbox.
- 📋 **House: 72-hour response SLA** to CAO comms (2 hours for emergencies).
- 📋 **SOAPBox account fields must match the access application** (company legal name, contacts) — process-side, verify in SOAPBox.
- 📋 **American Samoa office code**: we emit `HAQ00` per the House AQ remap (`offices.ts`); confirm with the Senate/House whether their systems expect `AQ00` vs `HAS00` before AS traffic.
- 📋 **House `/v2/validate` bill-type casing** (Title-case vs lowercase) — confirm before House go-live (`constants.ts` note).

## Delivery routing — CWC vs. fallback (the "~46 other offices")

The House mandates CWC for all 435 offices, but the Senate is voluntary
(~54 participating, ~46 not). We need a per-recipient router:

1. `verifyConstituent(address, official)` — confirm they're represented (below).
2. Look up the office code in the live `getActiveOffices()` list.
   - **Participating** → send via CWC (this module).
   - **Not participating** → fall back to the existing `src/lib/delivery`
     path (staffer email / webform / phone) — same as today.
3. Cache the active-offices list (refresh ~daily); George emails delivery
   agents when a new office joins.

**Router built (`delivery-router.ts`):** `chooseDeliveryChannel(official, {activeOfficeCodes, captchaBlockedIds})` picks CWC if the seat participates, else automate its contact webform (unless CAPTCHA-blocked), else email, else phone. `routeDelivery()` returns coverage counts. Pure decision fn (no Playwright import). 7 tests.

**Still to build for the ~46 non-participating Senate offices (decision: go native webform, not just fallback):**
1. Server-side **webform sender** wrapping `src/lib/form-automation` (`submitToRepresentative`, Claude Vision + Playwright — already exists) to fill + submit an office's contact form. Must handle Senate forms' address/constituency verification step (`form-automation/test-amodei.ts` has the multi-step pattern) and verify submission via the Vision checker.
2. Feed live `getActiveOffices()` into `chooseDeliveryChannel` at send time.
3. Build a **CAPTCHA map** (`form-automation/audit.ts`) → `captchaBlockedIds`, so CAPTCHA offices route to email.
4. Rate-limit both paths.

## Correct-official verification (`verify.ts`) ✅ built

- Re-geocodes the constituent's full street address and requires it to produce
  the SAME seat code as the target, else refuses. Senate = state match; House =
  district match (unresolved district vs numbered target = mismatch = block).
- **CWC path: hard-block** on any failure. **Production (mailto/webform):
  warn-and-confirm** — surface the mismatch and let the user fix a typo'd
  address. Same guard, caller chooses strictness. Production wiring is a
  separate reviewable change (does not silently alter the live flow).

## Send orchestration (`send.ts` → `sendCwcDelivery`) ✅ built

The one path a real send goes through, gates in order: compliance gate
(fail-closed billLevel, stance, PII) → **constituent verification (mandatory
in production)** → maintenance window (Senate) → active-offices check (refuse
→ router fallback) → idempotent DeliveryId from the log → build + send (rate
permit claimed at the POST choke point; backpressure and endpoint 429s both
surface as `retry-later`) → outcome + raw response recorded.

## Not started (next milestones)

- Recipient resolution (address → correct office code, incl. House ZIP+4 district) fed from address-accurate rep resolution.
- Production API route that calls `sendCwcDelivery` from the app's contact flow.
- Webform sender for the ~46 non-participating Senate offices (form-automation wrap).
