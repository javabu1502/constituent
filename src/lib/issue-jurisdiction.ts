/**
 * Which level of government actually handles an issue.
 *
 * Used to guide people to the RIGHT officials before they pick who to write —
 * a letter about immigration to a city council member, or about trash pickup
 * to a US senator, goes nowhere. Weights: 2 = primary authority (best match),
 * 1 = shares authority (also worth contacting), 0 = little direct authority.
 *
 * Client-safe: pure data + string matching, no server deps.
 */

export type GovLevel = 'federal' | 'state' | 'local';

export interface JurisdictionGuidance {
  weights: Record<GovLevel, 0 | 1 | 2>;
  /** One-line, plain-language reason per level, shown under section headers. */
  why: Partial<Record<GovLevel, string>>;
}

interface JurisdictionRule {
  pattern: RegExp;
  guidance: JurisdictionGuidance;
}

const RULES: JurisdictionRule[] = [
  {
    pattern: /immigra|border|asylum|visa|daca|refugee|deport|citizenship/i,
    guidance: {
      weights: { federal: 2, state: 1, local: 0 },
      why: {
        federal: 'Immigration law is set by Congress — your US senators and representative are the decision-makers here.',
        state: 'States decide some related policies (licenses, in-state tuition, local enforcement cooperation).',
      },
    },
  },
  {
    pattern: /health|medicare|medicaid|insurance|prescription|drug price|mental health|reproductive|abortion|hospital/i,
    guidance: {
      weights: { federal: 2, state: 2, local: 0 },
      why: {
        federal: 'Congress controls Medicare, the ACA, and drug pricing policy.',
        state: 'States run Medicaid, regulate insurers and hospitals, and set many care access laws.',
      },
    },
  },
  {
    pattern: /education|school|student loan|teacher|tuition|college|curriculum|book ban/i,
    guidance: {
      weights: { federal: 1, state: 2, local: 2 },
      why: {
        state: 'States set school funding, standards, and teacher policy — the biggest levers in education.',
        local: 'School boards and local officials decide budgets, curriculum details, and district policy.',
        federal: 'Congress handles student loans and federal education funding.',
      },
    },
  },
  {
    pattern: /climate|environment|clean energy|emission|pollution|epa|renewable|drilling|wildfire/i,
    guidance: {
      weights: { federal: 2, state: 2, local: 1 },
      why: {
        federal: 'The EPA, national emissions rules, and energy policy run through Congress.',
        state: 'States regulate utilities, set renewable targets, and issue permits.',
        local: 'Cities decide building codes, transit, and local resilience projects.',
      },
    },
  },
  {
    pattern: /gun|firearm|second amendment|shooting|red flag/i,
    guidance: {
      weights: { federal: 1, state: 2, local: 0 },
      why: {
        state: 'Most gun laws (permits, red-flag laws, carry rules) are set at the state level.',
        federal: 'Congress sets background-check and interstate rules.',
      },
    },
  },
  {
    pattern: /housing|rent|homeless|zoning|eviction|mortgage|affordable hous/i,
    guidance: {
      weights: { federal: 1, state: 2, local: 2 },
      why: {
        local: 'Zoning, permitting, and most housing decisions happen at city and county level.',
        state: 'States set landlord-tenant law and fund housing programs.',
        federal: 'Congress funds HUD, Section 8, and tax credits for affordable housing.',
      },
    },
  },
  {
    pattern: /\btax|irs|tariff|budget|spending|deficit|social security|medicare tax/i,
    guidance: {
      weights: { federal: 2, state: 2, local: 1 },
      why: {
        federal: 'Federal taxes, Social Security, and the national budget are Congress’s job.',
        state: 'State income, sales, and property tax rules are set by your state legislature.',
      },
    },
  },
  {
    pattern: /veteran|\bva\b|military famil|servicemember/i,
    guidance: {
      weights: { federal: 2, state: 1, local: 0 },
      why: {
        federal: 'VA benefits and military policy are federal — your members of Congress can also cut through VA red tape for you directly.',
        state: 'States run veterans homes and some benefit programs.',
      },
    },
  },
  {
    pattern: /police|crime|criminal justice|prison|sentencing|bail|public safety|drug|fentanyl/i,
    guidance: {
      weights: { federal: 1, state: 2, local: 2 },
      why: {
        state: 'Criminal law, sentencing, and prisons are mostly state-level.',
        local: 'Police departments answer to city and county officials.',
        federal: 'Congress sets federal crimes and funds local programs.',
      },
    },
  },
  {
    pattern: /road|bridge|transit|infrastructure|broadband|highway|rail|traffic|pothole/i,
    guidance: {
      weights: { federal: 1, state: 2, local: 2 },
      why: {
        state: 'State DOTs decide which roads and transit projects get built.',
        local: 'Cities and counties maintain local streets and approve projects.',
        federal: 'Congress funds the big infrastructure programs.',
      },
    },
  },
  {
    pattern: /voting|election|ballot|gerrymander|redistrict|voter/i,
    guidance: {
      weights: { federal: 1, state: 2, local: 1 },
      why: {
        state: 'States run elections — registration, ballots, and district maps.',
        federal: 'Congress sets baseline voting-rights protections.',
        local: 'County officials administer polling places and counts.',
      },
    },
  },
  {
    pattern: /economy|jobs|wage|inflation|worker|labor|union|small business|employment/i,
    guidance: {
      weights: { federal: 2, state: 2, local: 0 },
      why: {
        federal: 'Congress shapes national economic policy, labor law, and the minimum wage floor.',
        state: 'States set their own minimum wage, worker protections, and business rules.',
      },
    },
  },
  {
    pattern: /civil rights|discrimination|lgbtq|equality|disability rights/i,
    guidance: {
      weights: { federal: 2, state: 2, local: 1 },
      why: {
        federal: 'Federal civil-rights law sets the national floor.',
        state: 'States can extend protections further than federal law.',
      },
    },
  },
  {
    pattern: /foreign|ukraine|israel|china|nato|war|sanction|trade deal/i,
    guidance: {
      weights: { federal: 2, state: 0, local: 0 },
      why: {
        federal: 'Foreign policy is entirely federal — only your members of Congress have a vote here.',
      },
    },
  },
  {
    pattern: /child care|childcare|family leave|foster|adoption/i,
    guidance: {
      weights: { federal: 1, state: 2, local: 1 },
      why: {
        state: 'States license child care and run family-support programs.',
        federal: 'Congress decides child tax credits and national family-leave policy.',
      },
    },
  },
];

const DEFAULT_GUIDANCE: JurisdictionGuidance = {
  weights: { federal: 1, state: 1, local: 1 },
  why: {},
};

/**
 * Best-effort mapping from a free-text issue to the levels of government that
 * handle it. Falls back to "all levels somewhat relevant" for unknown issues.
 */
export function getJurisdiction(issueText: string): JurisdictionGuidance {
  const text = (issueText || '').trim();
  if (!text) return DEFAULT_GUIDANCE;
  for (const rule of RULES) {
    if (rule.pattern.test(text)) return rule.guidance;
  }
  return DEFAULT_GUIDANCE;
}

export function matchLabelForLevel(guidance: JurisdictionGuidance, level: GovLevel): 'best' | 'also' | 'low' {
  const w = guidance.weights[level];
  return w === 2 ? 'best' : w === 1 ? 'also' : 'low';
}
