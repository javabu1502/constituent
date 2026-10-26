/**
 * Public read-only demo of the org backend. The demo org account owns ONLY
 * demo- prefixed campaigns (the Nevada Children First Coalition portfolio);
 * both conditions below must hold before any page or API treats a request as
 * a demo read, so a future real campaign under this account can never leak
 * into the public demo, and nobody else's "demo-" slug ever qualifies.
 */
export const DEMO_ORG_USER_ID = '5b807805-8a66-4497-8f46-cf9b92bff610';

export function isDemoCampaign(campaign: { slug?: string | null; creator_id?: string | null }): boolean {
  return !!campaign.slug?.startsWith('demo-') && campaign.creator_id === DEMO_ORG_USER_ID;
}

/**
 * The name every demo surface shows.
 *
 * It used to be read from whichever seeded campaign happened to come back
 * first, and one of them carries a real customer's organization name, so the
 * public demo introduced itself as them while the banner beside it said the
 * data was from a fictional coalition. A demo should never be able to borrow
 * a real organization's identity from a data row.
 */
export const DEMO_ORG_NAME = 'Silver State Families Alliance';
