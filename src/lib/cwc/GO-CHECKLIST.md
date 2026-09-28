# CWC go-live checklist

> **2026-09-28 — CURRENT STATE.** Both chambers approved for production. All
> code is on `main`; delivery is dark behind three env flags.
> The sections below this box are the historical UAT/acceptance steps.

## Supervised first send (the plan)

Flags: `NEXT_PUBLIC_CWC_ENABLED` (client collects title + email) ·
`CWC_DELIVERY_ENABLED` (track-send screens + enqueues) · `CWC_QUEUE_ENABLED`
(cron drains every 5 min). Enable the first two, keep the third OFF, and drain
hand-picked rows from `/admin/cwc-queue` (admin = `ADMIN_EMAILS`).

Pre-flight (all done 2026-09-28, repeat on the day):
- `npx tsx scripts/house-prod-preflight.ts` → egress 52.54.159.237 / 52.73.143.252, `Validation Passed`.
- Production active offices parse: House 442 codes incl. HNV02; Senate 53 incl. SNV01 (Rosen); SNV03 (Cortez Masto) absent → her row will be `routed`, never sent.
- Vercel prod env has: CWC_DELIVERY_AGENT, CWC_HOUSE_DELIVERY_AGENT, CWC_ACK_EMAIL, CWC_CONTACT_NAME/EMAIL/PHONE, CWC_HOUSE_API_KEY, SCWC_API_KEY, QUOTAGUARD_URL, CRON_SECRET, ADMIN_EMAILS.
- DB: cwc_send_queue / cwc_deliveries / message_compliance / rate_permits + claim_cwc_send_jobs / allocate_rate_permit exist (real selects, not head:true).

Steps:
1. Set `NEXT_PUBLIC_CWC_ENABLED=true` + `CWC_DELIVERY_ENABLED=true`, redeploy. `CWC_QUEUE_ENABLED` stays unset.
2. Jared runs the contact flow (Mr., real Reno address, real email, Head Start → Families), selects Amodei + Rosen only, clicks send once per official.
3. `/admin/cwc-queue`: expect 2 rows `queued` (HNV02, SNV01), correct constituent block, no name/address in the body, `Families` topic, no bill.
4. Send now → HNV02. Success = delivery log `delivered`, HTTP 200, House body. `failed` = the endpoint refused (reason in last_error); nothing left our side.
5. Send now → SNV01. Success = `delivered`, HTTP 201.
6. Decide: leave the two flags on (every federal message from every visitor now queues and needs draining) or turn them off again. Turn `CWC_QUEUE_ENABLED` on only when unsupervised draining is wanted.

Rollback at any step: unset the flag(s) + redeploy; Hold any queued row from the admin page.

---

## Historical: UAT / acceptance steps (2026-08)

Everything below was STAGED, not active. None of it runs or affects production
until (1) this branch is merged + deployed and (2) the admin test route is hit
by an admin. No message is ever sent to a real office by these steps — House
uses UAT and `/v2/validate`; the Senate uses its test sandbox.

## House — ready now (IPs already whitelisted via Malcolm)

1. **Set env in Vercel (Production):**
   - `CWC_DELIVERY_AGENT` = `My Democracy LLC` (must match the House access application)
   - `CWC_ACK_EMAIL` = a delivery-agent ack address (e.g. jared@mydemocracy.app)
   - `CWC_CONTACT_NAME` = `Jared Busker`
   - `CWC_CONTACT_EMAIL` = `jared@busker.consulting`
   - `CWC_CONTACT_PHONE` = `815-988-4475`
   - `CWC_HOUSE_UAT_API_KEY` = (value in `Jared Shared Resources/house-uat-url-and-api-key.png`)
   - `QUOTAGUARD_URL` — already set.
2. **Merge PR #3** to `main`.
3. **Deploy:** `vercel --prod`.
4. **Connectivity check (no CWC call):** as an admin, GET
   `/api/admin/cwc-test?chamber=house&action=preview` → returns the built XML and
   the egress IP. Confirm the IP is `52.54.159.237` or `52.73.143.252`.
5. **Validate (sends nothing):** `?action=validate` → House `/v2/validate`.
   Expect `result.ok = true`. If a bill-referencing message fails, switch House
   bill-type casing to lowercase (`hr`, `s`) — see `constants.ts` note.
6. **Test message to UAT sandbox:** `?action=send` → House UAT `/v2/message`.

## Senate — KEY RECEIVED 2026-08-12 ("Approved for Testing")

Endpoints are now hardcoded defaults from the SOAPBox Technical Information
page (env vars still override). Testing key is in Vercel prod as
`SCWC_TEST_API_KEY`. Production key: not yet assigned — comes AFTER passing
testing.

**HARD GATE (Jared, 2026-08-12): no requests to House OR Senate — not even a
validate or an offices fetch — until Lee has reviewed this PR.**

Official acceptance path (from the SOAPBox doc), once Lee approves:
1. Authenticate to the testing endpoint with `SCWC_TEST_API_KEY`.
2. `GET api/active_offices` — refresh participating offices (required
   regularly; unlisted offices reject).
3. Run the acceptance harness: `CWC_ACCEPTANCE_CONFIRM=YES
   CWC_ACCEPTANCE_ENV=test npx tsx scripts/cwc-acceptance-run.ts` — 3 distinct
   campaigns (bill+Pro, same-bill+Con, no-bill) × all 100 test office codes,
   rate-limited via `sendBatch`, every result logged to `cwc_deliveries`
   (expect `201 Created`; `400` body explains validation failures; `409` =
   reused DeliveryId, i.e. an idempotent retry of a message that already
   landed). Re-running retries with the SAME DeliveryIds — safe.
4. Apply the migration first: `supabase/migrations/20260817000000_cwc_deliveries.sql`.
5. **Email `saacwc@saa.senate.gov`** that campaigns are in the testing
   environment; follow SCWC Admin guidance.
6. Pass testing → "Approved for Production" → retrieve prod key into
   `SCWC_API_KEY`, re-run getoffices, maintain compliance.

Note: testing office codes do NOT indicate production participation. SCWC
maintenance windows: Sun 12a–6a and Wed 5a–7a ET — `sendBatch` and
`sendCwcDelivery` refuse to start inside them automatically.

## Now wired in code (was "before production", done on this branch)

- ✅ Signature strip: `buildCwcXml` strips the closing/name/address block from
  the body on every path; the gate flags anything that survives.
- ✅ Pre-send gate `assertCwcSendable`: state-bill block, bill⇒ProOrCon,
  signature check — wired into `sendCwcDelivery` + the admin test route.
- ✅ Active-offices filtering: `getActiveOfficeCodesCached` (12h TTL,
  force-refresh) inside `sendCwcDelivery`; unlisted offices fall back to the
  delivery-router webform/email path.
- ✅ Delivery log + idempotent retry: `cwc_deliveries` table (service-role
  only) + `delivery-log.ts`; DeliveryIds are minted once and reused, 400/500s
  recorded for the SOAPBox monitoring requirement.
- ✅ Rate limit: `sendBatch` enforces 5/sec and is used by the harness.
- ✅ Maintenance windows: `isInScwcMaintenanceWindow` + batch/send guards.

## Still process-side (not code)

- Confirm SOAPBox account fields exactly match the access application
  (company legal name = `CWC_DELIVERY_AGENT`, contact name/email/phone).
- American Samoa: we emit `HAQ00` (House AQ remap). Confirm AQ00 vs HAS00
  expectations with the chambers before AS traffic.
- Confirm House bill-type casing against `/v2/validate` (Title-case vs the
  lowercase in House sample XML) before House go-live.
- Apply the `cwc_deliveries` migration in Supabase before any logged send.
