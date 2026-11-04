/**
 * The policy categories people actually browse by.
 *
 * Campaigns carry issue_area as free text, written by whoever created them,
 * and three vocabularies accumulated: informal lowercase ('healthcare'),
 * Library of Congress policy areas ('Health'), and one-off phrasings
 * ('Technology and Online Safety'). The /issues filter builds its chips from
 * the distinct values, so on 2026-11-04 a visitor saw 30 chips for 79
 * weigh-ins, with healthcare and Health as separate filters, and technology
 * split three ways.
 *
 * These categories are the public vocabulary: plain words people search for,
 * not the LoC's. 'Economics and Public Finance' is a cataloguing term; nobody
 * types it. Every known label maps onto one of these, and anything unknown
 * falls to 'other' rather than inventing a new chip.
 *
 * Matching is on the raw label, so campaigns do not have to be rewritten and
 * a future creator typing something new still lands somewhere sensible.
 */
export interface PolicyTopic {
  slug: string;
  label: string;
  /** Used as the topic page's lede and meta description. */
  blurb: string;
  /** Lower-cased issue_area values that belong here. */
  matches: string[];
}

export const POLICY_TOPICS: PolicyTopic[] = [
  {
    slug: 'health-care',
    label: 'Health care',
    blurb: 'Coverage, costs, Medicaid and Medicare, prescription drugs, and reproductive health.',
    matches: ['healthcare', 'health care', 'health'],
  },
  {
    slug: 'families-and-children',
    label: 'Families and children',
    blurb: 'Child care, foster care, early childhood, family leave, and the programs families rely on.',
    matches: ['families', 'families & children', 'children', 'social welfare'],
  },
  {
    slug: 'education',
    label: 'Education',
    blurb: 'Schools, student loans, college costs, and who decides what gets taught.',
    matches: ['education'],
  },
  {
    slug: 'housing',
    label: 'Housing',
    blurb: 'Rent, homelessness, zoning, and whether people can afford to live where they work.',
    matches: ['housing', 'housing and community development'],
  },
  {
    slug: 'jobs-and-labor',
    label: 'Jobs and labor',
    blurb: 'Wages, union rights, paid leave, and workplace protections.',
    matches: ['labor', 'labor and employment', 'jobs'],
  },
  {
    slug: 'money-and-the-economy',
    label: 'Money and the economy',
    blurb: 'Prices, banking, consumer protection, and how the economy is managed.',
    matches: [
      'economy',
      'economics and public finance',
      'commerce',
      'finance and financial sector',
      'financial regulation',
    ],
  },
  {
    slug: 'taxes',
    label: 'Taxes',
    blurb: 'Who pays what, deductions and credits, and how public money is raised.',
    matches: ['taxation', 'taxes'],
  },
  {
    slug: 'civil-rights-and-voting',
    label: 'Civil rights and voting',
    blurb: 'Voting access, redistricting, discrimination, and how government answers to people.',
    matches: [
      'civil rights',
      'civil rights and liberties, minority issues',
      'elections and voting',
      'government operations and politics',
    ],
  },
  {
    slug: 'criminal-justice',
    label: 'Criminal justice',
    blurb: 'Policing, sentencing, courts, and public safety.',
    matches: ['crime and law enforcement', 'criminal justice', 'justice'],
  },
  {
    slug: 'guns',
    label: 'Guns',
    blurb: 'Background checks, red flag laws, and firearm regulation.',
    matches: ['guns', 'gun policy', 'firearms'],
  },
  {
    slug: 'immigration',
    label: 'Immigration',
    blurb: 'Borders, visas, asylum, and the status of people already here.',
    matches: ['immigration'],
  },
  {
    slug: 'environment-and-energy',
    label: 'Environment and energy',
    blurb: 'Climate, pollution, public lands, and how power gets generated.',
    matches: ['environment', 'environmental protection', 'energy', 'climate'],
  },
  {
    slug: 'technology',
    label: 'Technology',
    blurb: 'Privacy, artificial intelligence, online safety for children, and platform rules.',
    matches: [
      'technology',
      'technology and online safety',
      'science, technology, communications',
      'science and technology',
    ],
  },
  {
    slug: 'transportation-and-infrastructure',
    label: 'Transportation and infrastructure',
    blurb: 'Roads, transit, water, broadband, and disaster response.',
    matches: ['infrastructure', 'transportation and public works', 'transportation'],
  },
  {
    slug: 'food-and-farming',
    label: 'Food and farming',
    blurb: 'Farm policy, food assistance, and what reaches the table.',
    matches: ['agriculture', 'agriculture and food', 'food'],
  },
  {
    slug: 'veterans-and-military',
    label: 'Veterans and military',
    blurb: 'Veterans' + "' " + 'benefits and care, service members, and defense policy.',
    matches: ['veterans', 'armed forces and national security', 'defense', 'military'],
  },
  {
    slug: 'foreign-policy',
    label: 'Foreign policy and trade',
    blurb: 'Alliances, sanctions, tariffs, and the country’s role abroad.',
    matches: ['foreign policy', 'international affairs', 'foreign trade and international finance', 'trade'],
  },
  {
    slug: 'other',
    label: 'Other',
    blurb: 'Questions that do not sit in one of the categories above.',
    matches: [],
  },
];

const BY_LABEL = new Map<string, PolicyTopic>();
for (const t of POLICY_TOPICS) for (const m of t.matches) BY_LABEL.set(m, t);

const BY_SLUG = new Map(POLICY_TOPICS.map((t) => [t.slug, t]));

export const OTHER_TOPIC = POLICY_TOPICS[POLICY_TOPICS.length - 1];

/** The category a raw issue_area belongs to. Never null: unknown lands in 'other'. */
export function topicFor(issueArea: string | null | undefined): PolicyTopic {
  const key = (issueArea ?? '').trim().toLowerCase();
  if (!key) return OTHER_TOPIC;
  const exact = BY_LABEL.get(key);
  if (exact) return exact;
  // A new phrasing that contains a known one ("state healthcare costs").
  for (const [label, topic] of BY_LABEL) {
    if (key.includes(label)) return topic;
  }
  return OTHER_TOPIC;
}

export function topicBySlug(slug: string): PolicyTopic | null {
  return BY_SLUG.get(slug) ?? null;
}

/** Topics that actually have something in them, in the display order above. */
export function topicsPresentIn(issueAreas: (string | null | undefined)[]): PolicyTopic[] {
  const present = new Set(issueAreas.map((a) => topicFor(a).slug));
  return POLICY_TOPICS.filter((t) => present.has(t.slug));
}
