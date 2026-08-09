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

## Senate — ready to finish the moment George emails Monday

Code is already env-driven; only these values are missing:
1. **Set env in Vercel:** `SCWC_TEST_URL` = test endpoint, `SCWC_TEST_API_KEY` =
   testing key (later `SCWC_PRODUCTION_URL` + `SCWC_API_KEY`), `SCWC_OFFICES_URL`
   = Get Active Offices endpoint.
2. **Test to sandbox:** `/api/admin/cwc-test?chamber=senate&action=send` → posts
   to the Senate TEST env (stays in the SAA sandbox).
3. **Email `saacwc@saa.senate.gov`** that test messages are ready for review
   (required by George).

## Before REAL production sends (not needed for testing)

- Strip the constituent's name/address from the generated message body (George's
  office-grouping rule) — currently in the message-generation path, not the CWC
  builder.
- Wire `getActiveOffices()` into recipient filtering so we only send to
  participating offices.
- Enforce the 5–10 msg/sec rate limit in the batch sender.
- Confirm House bill-type casing against `/v2/validate`.
