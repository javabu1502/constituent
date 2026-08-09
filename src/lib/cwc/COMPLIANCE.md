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
- ✅ **≥1 LibraryOfCongressTopic** from the Senate 31-topic list (not the House's newer list).
- ✅ **Subject** 6–500 chars; **OrganizationStatement/ConstituentMessage** 6–10,000, at least one present.
- ✅ **Bill type abbreviations** transcribed literally from the schema (incl. the `H.Con.Res` no-trailing-dot quirk); **ProOrCon** = Pro/Con.
- ✅ **Phone** normalized to `XXX-XXX-XXXX`; **Zip** 5-digit or ZIP+4; **State** ∈ valid code set; **Email** pattern-checked.

## George's content recommendations — "deal-breakers" for office trust

- ✅ **Every XML tag on its own line** (offices read raw XML in their CRM) — enforced + tested.
- ✅ **Campaign ID groups by specific subtopic/bill.** "Health / Medicare" ≠ "Health / vaccine policy" = different campaigns (`campaign-id.ts`, SHA-256).
- ✅ **Bill referenced → include ProOrCon, and split pro vs con into separate campaigns** — stance is part of the campaign-id key + emitted as `<ProOrCon>`.
- ✅ **AI-personalized text → `ConstituentMessage`; untouched template → `OrganizationStatement`.** Both supported; be consistent.
- 🟡 **Do NOT repeat the constituent's name/mailing address in the message body/closing** (breaks office dedup/grouping). The builder already keeps name/address in structured tags only — but `generate-message` currently writes a signed closing. **Action: strip name/address from the generated body on the CWC path.**
- 🟡 **Ask the constituent pro/con when a bill is referenced.** Weigh-ins already capture stance; the contact flow needs it wired to `message.stance`.
- 🟡 **Only send from real constituents of that office.** `offices.ts` now resolves office codes safely: Senate is deterministic (state + senate class, cross-checked against the static seat table), House is state + district. Both refuse to guess (explicit failure, never a wrong code). REMAINING RISK: the House district itself must come from an accurate **ZIP+4 → district** lookup upstream; at split-ZIP boundaries a 5-digit ZIP can map to the wrong district. Must feed `resolveOfficeCode` from address-accurate rep resolution, not a raw ZIP.
- 🟡 **Don't send federal offices about state bills.** Product/UX guard.

## Operational rules

- ✅ **Rate limit 5–10 msg/sec** — `MAX_MESSAGES_PER_SECOND` constant; the batch sender (TODO) must honor it.
- 🟡 **Run Get Active Offices before campaigns; only send to listed offices** (Senate participation is voluntary, ~50/100). `getActiveOffices()` added in `client.ts`; still need to call it pre-campaign and filter recipients against it.
- ✅ **Proxy scoped to CWC only**, Node runtime, both static IPs whitelisted (`client.ts`, README).
- 📋 **Notify `saacwc@saa.senate.gov` when test messages are ready for review** (Senate).
- 📋 **Separate test/prod endpoints + keys**; Senate test env accepts all 100 offices but keeps them in the sandbox.
- 📋 **House: 72-hour response SLA** to CAO comms (2 hours for emergencies).

## Not started (next milestones)

- Recipient resolution (address → correct office code, incl. House ZIP+4 district).
- API route that calls the module (Node runtime) + `vercel.json` `maxDuration`.
- Batch sender honoring the rate limit + Get Active Offices filtering.
- Senate send/validate client (waiting on endpoints + key).
- Wire message generation to omit name/address in body on the CWC path.
