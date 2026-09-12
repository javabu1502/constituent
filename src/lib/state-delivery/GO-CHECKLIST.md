# State email delivery — go-live checklist

STAGED, not active. This module builds and (optionally) sends authenticated
on-behalf-of emails to state legislators, but nothing here is wired into a live
campaign flow or deployed. Unlike federal, there is no sanctioned pipe (no CWC
for states) — so delivery is best-effort email, and **sender reputation is the
whole game**. Do NOT flip this on for a paying org until the reputation setup
below is in place, or deliverability will be poor and could burn our domain.

## Deliverability foundation (do first — this is what makes it work)
1. **Authenticated sending domain** for `RESEND_FROM_EMAIL` — SPF, DKIM, and a
   DMARC policy. Use a dedicated subdomain (e.g. `send.mydemocracy.app`) so
   advocacy volume can't hurt transactional/auth email reputation.
2. **Dedicated IP + warmup** once volume grows (Resend supports this). Ramp
   volume gradually; cold-blasting legislator inboxes gets filtered.
3. **Bounce + complaint handling** — a Resend webhook that records bounces/
   spam-complaints and suppresses bad addresses. Feeds delivery analytics.

## Wiring (the integration step)
4. Resolve each target's email: Open States email → `withOverride()` from the
   Layer-2 enrichment table → else webform/none (`resolveTargetChannel`).
5. Build the message with the two-block model (org statement + constituent
   message), Reply-To the constituent (`buildStateEmail` does this).
6. Send via `sendStateBatch` (paced, per-item results). Record each send
   (sent/bounced) for the org intel + suppression.
7. Webform fallback (the ~2% with no email) reuses the CWC webform engine.

## Guardrails
- Never spoof the constituent's From address (fails DKIM/DMARC). From is our
  domain; the human is shown via the display name + Reply-To.
- Apply the same content rules as CWC where relevant (no vile language filter;
  neutral-vs-advocacy is per the org's campaign, not My Democracy's own).
- Rate: keep `maxPerSecond` conservative and pace campaigns; legislator inboxes
  and their CRMs flag bursts.

## Env
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (authenticated domain).
