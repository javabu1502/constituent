# CWC delivery (`src/lib/cwc`)

Delivers constituent messages to House and Senate offices via the official
**Communicating With Congress** APIs, replacing mailto/webform handoff.

**Status (2026-09-28): production-approved by both chambers, shipped dark.**
Senate acceptance 300/300 (08-31, SAA review passed 09-18); House UAT 12/12
(09-18), production key activated 09-28 (`/v2/validate` on cwc.house.gov =
"Validation Passed" from the whitelisted IP). Delivery is gated by three env
flags, all OFF until the supervised first send: `NEXT_PUBLIC_CWC_ENABLED`
(client collects title + email), `CWC_DELIVERY_ENABLED` (track-send enqueues),
`CWC_QUEUE_ENABLED` (cron drains). `/admin/cwc-queue` drains chosen rows.

## Design principle

The CWC XML payload is the **same spec for both chambers**; the Senate just
validates more strictly and adds content rules. So we build to the Senate rules
(transcribed from the authoritative RelaxNG schema) and the House accepts the
same payload. See `COMPLIANCE.md` for the rule-by-rule mapping to George
Dollery's guidance from the SAA onboarding call.

## Usage

```ts
import { buildCwcXml, validateHouse, buildCampaignId } from '@/lib/cwc';

const delivery = {
  chamber: 'house',
  officeCode: 'HNY12',                 // seat code, not the person
  campaignId: buildCampaignId({ topicKey: 'Health / Insulin pricing', stance: 'pro' }),
  constituent: { prefix: 'Ms.', firstName: 'Jane', lastName: 'Doe',
    address1: '…', city: '…', state: 'NY', zip: '10118-0110', email: '…' },
  message: { subject: '…', topics: ['Health'], stance: 'pro',
    constituentMessage: '…' },
};

const result = await validateHouse(delivery);  // checks XML, sends nothing
// buildCwcXml(delivery) throws CwcValidationError (with a full problem list)
// before anything hits the network.
```

## Required environment variables

| Var | Purpose |
|---|---|
| `CWC_DELIVERY_AGENT` | Company legal name — **must** match the access application (`My Democracy LLC`) |
| `CWC_ACK_EMAIL` `CWC_CONTACT_NAME` `CWC_CONTACT_EMAIL` `CWC_CONTACT_PHONE` | Delivery-agent contact block |
| `CWC_HOUSE_UAT_API_KEY` / `CWC_HOUSE_API_KEY` | House test / production API keys |
| `SCWC_TEST_URL` / `SCWC_PRODUCTION_URL` | Senate endpoints (issued with the Senate key) |
| `QUOTAGUARD_URL` | QuotaGuard proxy connection string (static-IP egress) |

Secrets live only in Vercel env / `.env.local`, never in the repo.

## QuotaGuard static-IP setup (step by step)

The House **requires** our traffic to originate from fixed IPs
(`52.54.159.237`, `52.73.143.252`). Vercel's serverless egress is dynamic, so we
route CWC calls through QuotaGuard **Shield**'s proxy.

1. **Sign in** at quotaguard.com and open your **QuotaGuard Shield** instance.
2. Under **Connection Information**, copy the **CONNECTION URL** (an HTTPS proxy
   like `https://user:pass@us-east-shield-02.quotaguard.com:9294`) and confirm
   the two IPs listed are `52.54.159.237` and `52.73.143.252`. Both must be
   whitelisted — traffic can route through either at any time.
3. In **Vercel → constituent → Settings → Environment Variables**, add
   `QUOTAGUARD_URL` = that connection URL (Production + Preview). Save.
4. Redeploy so the variable is available to functions.
5. Verify egress: call `checkEgressIp()` from a Node-runtime route — it should
   return one of the two IPs.

Notes: the proxy is attached **only** to CWC requests (a per-request undici
dispatcher), never globally — other traffic (Supabase, Anthropic, Congress.gov)
does not go through the metered proxy. CWC routes must use the **Node.js
runtime**, not Edge, and bump `maxDuration` in `vercel.json` for proxy latency.

## House IP whitelisting

Separately from the proxy, both IPs must be registered with the House —
via the SOAPBox portal's IP field and/or by emailing `cwc.vendors@mail.house.gov`.
Draft email is tracked with the team.
