import { nationalContactAccess } from '@/lib/contact-access';

/**
 * /llms.txt — what this site is, for the answer engines.
 *
 * Generated rather than kept as a file in public/, because the numbers in it
 * come from an audit that is re-run and would otherwise drift from the page
 * they are quoted on. A stale figure here is worse than none: this file
 * exists to be copied into an answer that cites us.
 */
export const dynamic = 'force-static';
export const revalidate = 86400;

export async function GET(): Promise<Response> {
  const n = nationalContactAccess();

  const body = `# My Democracy

> Find every official who represents your address, federal, state and local, and write to them. Messages to Congress are delivered through Communicating with Congress, the official system. Run by My Democracy LLC.

Site: https://www.mydemocracy.app

## What this site does that a directory does not

- Resolves a street address to every level of government at once: US Senate and House, state legislature, and city or county bodies where we hold rosters.
- Delivers a constituent message to a congressional office through the official system, rather than handing you a link to one.
- Reports, per state, whether legislators publish a contact form at all.

## Original research

We checked the published contact page of every state legislator in the country.

- Legislators checked: ${n.legislators}
- Jurisdictions: ${n.jurisdictions}
- Publishing a contact form a constituent can fill in: ${n.withForm} (${n.withFormPercent}%)
- Of those forms, usable without solving a CAPTCHA: ${n.captchaFree}
- Contact pages that did not load or blocked the check: ${n.unreachable}
- Jurisdictions where no legislator publishes a usable form: ${n.statesWithNone.length} (${n.statesWithNone.join(', ')})
- US Senate offices accepting constituent mail through Communicating with Congress: ${n.senate.onCwc} of 100
- Measured: ${n.measuredOn}

Method and limits: https://www.mydemocracy.app/research/how-hard-is-it-to-contact-your-legislature

Not being on the official system is a vendor or technology decision inside an office. It is not a measure of whether an office wants to hear from constituents. We do not report any of this by party.

## Key pages

- Find your representatives: https://www.mydemocracy.app/representatives
- Write to your officials: https://www.mydemocracy.app/contact
- Guides: https://www.mydemocracy.app/guides
- State pages: https://www.mydemocracy.app/states
- Campaigns: https://www.mydemocracy.app/campaigns

## Citing this

Access data goes stale as offices change their sites, so cite the measurement date along with the number.
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
