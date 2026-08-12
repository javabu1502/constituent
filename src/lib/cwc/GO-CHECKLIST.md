# CWC go-live checklist

Everything below is STAGED, not active. None of it runs or affects production
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
3. POST multiple test campaigns exercising the 100 test Member office codes
   from the technical documentation (Content-Type `application/xml`; expect
   `201 Created`; a `400` body explains validation failures; `409` = reused
   DeliveryId).
4. **Email `saacwc@saa.senate.gov`** that campaigns are in the testing
   environment; follow SCWC Admin guidance.
5. Pass testing → "Approved for Production" → retrieve prod key into
   `SCWC_API_KEY`, re-run getoffices, maintain compliance.

Note: testing office codes do NOT indicate production participation. SCWC
maintenance windows: Sun 12a–6a and Wed 5a–7a ET (intermittent outages).

## Before REAL production sends (not needed for testing)

- Strip the constituent's name/address from the generated message body (George's
  office-grouping rule) — currently in the message-generation path, not the CWC
  builder.
- Wire `getActiveOffices()` into recipient filtering so we only send to
  participating offices.
- Enforce the 5–10 msg/sec rate limit in the batch sender.
- Confirm House bill-type casing against `/v2/validate`.
