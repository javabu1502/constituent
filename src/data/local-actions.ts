/**
 * Local decisions a resident can still speak to.
 *
 * Weigh-ins live in the campaigns table and carry a target_level of federal
 * or state, so a city land-use case has nowhere to sit: the participate flow
 * would route a letter about a Reno rezoning to Congress. These entries are
 * static instead. They inform and point at the body that decides, rather than
 * generating a letter.
 *
 * Framing follows the same rule as an official weigh-in. State what is
 * proposed, give both cases, and let the reader take their own position. See
 * the campaign neutrality policy.
 */

export interface LocalActionSource {
  label: string;
  url: string;
}

export interface LocalDesignationChange {
  label: string;
  from: string;
  to: string;
  note?: string;
}

export interface LocalDecider {
  body: string;
  role: string;
  contact?: string;
  contactUrl?: string;
}

export interface LocalAction {
  slug: string;
  jurisdiction: string;
  caseNumber: string;
  projectName: string;
  applicant: string;
  title: string;
  summary: string;
  /** Where it is, in the words of the public notice. */
  location: string;
  parcels: string[];
  requests: string[];
  /** The case planner. Comments quoting the case number file against it. */
  plannerEmail: string;
  /**
   * 'oppose' or 'support' makes the page one-way, the way an advocacy
   * campaign is. 'neutral' offers both and suggests nothing, the way an
   * official weigh-in does.
   */
  stance: 'oppose' | 'support' | 'neutral';
  /** Whose position it is. Required whenever stance is not neutral. */
  stanceOwner?: string;
  changes: LocalDesignationChange[];
  deciders: LocalDecider[];
  /** What has already happened, newest last. */
  timeline: { date: string; event: string }[];
  status: string;
  caseFor: { point: string; source: LocalActionSource };
  caseAgainst: { point: string; source: LocalActionSource };
  context?: { heading: string; body: string; source: LocalActionSource };
  howToComment: string[];
  materials: LocalActionSource;
  /** When a human last checked these facts against the record. */
  lastVerified: string;
}

export const LOCAL_ACTIONS: LocalAction[] = [
  {
    slug: 'seneca-hills-reno',
    jurisdiction: 'City of Reno, Ward 4',
    caseNumber: 'LDC25-00057',
    projectName: 'Seneca Hills Business Park',
    applicant: 'Visionary 2, LLC and Castello, LLC',
    title: 'Rezoning 329 acres in the North Valleys',
    summary:
      'An application would redesignate about 329 acres west of North Virginia Street as industrial land and open space, and place the whole site in a single Specific Plan District. Industrial acreage roughly doubles. Mapped parks and open space also roughly double. The designations that currently allow housing on the site are removed.',
    location:
      'About 329.23 acres of undeveloped land north of Seneca Drive, south and west of the Union Pacific Railroad tracks, west of North Virginia Street.',
    parcels: ['082-180-77', '082-180-78', '082-083-10', '082-083-07'],
    requests: [
      'A Master Plan Amendment changing the land use designations across the site.',
      'A Zoning Map Amendment placing all 329.23 acres in a Specific Plan District (SPD).',
    ],
    plannerEmail: 'gilbertn@reno.gov',
    stance: 'oppose',
    stanceOwner: 'North Valleys residents organizing against the application',
    changes: [
      { label: 'Industrial', from: '75.95 acres', to: '156.80 acres', note: 'Roughly double the industrial land on the site today.' },
      { label: 'Parks, Greenways and Open Space', from: '93.09 acres', to: '172.43 acres', note: 'Also roughly doubles.' },
      { label: 'Large-Lot Neighborhood', from: '72.72 acres', to: 'none', note: 'A residential designation, removed.' },
      { label: 'Suburban Mixed-Use', from: '75.95 acres', to: 'none', note: 'Allowed a mix that can include housing, removed.' },
      { label: 'Unincorporated Transition', from: '11.52 acres', to: 'none' },
    ],
    deciders: [
      {
        body: 'Reno Planning Commission',
        role: 'Holds the public hearing on the application and makes a recommendation. This is the body to address if you want your position on the record.',
        contact: 'gilbertn@reno.gov · 775-334-2698',
        contactUrl: 'https://www.reno.gov/government/boards-commissions/planning-commission',
      },
      {
        body: 'Reno City Council',
        role: 'Takes the final vote on both the Master Plan Amendment and the Zoning Map Amendment. The site is in Ward 4.',
        contactUrl: 'https://www.reno.gov/government/city-council/',
      },
    ],
    timeline: [
      { date: 'April 2025', event: 'An earlier, smaller version of the project was filed, covering about 82 acres.' },
      { date: 'May 15, 2025', event: 'Ward 4 Neighborhood Advisory Board meeting on that earlier version.' },
      { date: 'August 2026', event: 'The Hawk Fire burned through the North Valleys. Horizon Hills was evacuated.' },
      { date: 'November 4, 2026', event: 'Applicant neighborhood meeting, held virtually. Not a public hearing, and no public officials attended.' },
    ],
    status:
      'The applicant neighborhood meeting has already happened. A Reno Planning Commission hearing date had not been published when this page was last checked. Comments sent to the planner go into the case record before that hearing.',
    caseFor: {
      point:
        'The site sits next to the rail corridor and existing industrial land, and the applicant has described the project as warehouse and office buildings. The application also nearly doubles the acreage mapped as parks and open space, and a Specific Plan District lets the city attach conditions written for this specific site rather than applying generic zoning.',
      source: { label: 'NVBEX, on the applicant’s filing', url: 'https://nevbex.com/2025/05/05/seneca-hills-business-park-reno/' },
    },
    caseAgainst: {
      point:
        'The Horizon Hills neighborhood has one route in and out. During the Hawk Fire in August 2026 that route congested while residents were leaving and emergency vehicles were arriving. Roughly doubling industrial acreage next to that neighborhood adds truck and commute traffic to the same road, in an area that has already burned.',
      source: { label: 'This Is Reno, on Hawk Fire road closures and evacuation', url: 'https://thisisreno.com/2026/08/photos-hawk-fire-updates-are-limited-sunday-morning/' },
    },
    context: {
      heading: 'Why evacuation keeps coming up',
      body:
        'The Hawk Fire started on August 22, 2026 and burned about 10,500 acres across the North Valleys. It destroyed 47 homes, which the state insurance commission recorded as the most destructive wildfire in Nevada. Horizon Hills was among the neighborhoods evacuated on the first day.',
      source: { label: 'KUNR, Hawk Fire coverage', url: 'https://www.kunr.org/hawk-fire' },
    },
    howToComment: [
      'Email the city planner on the case at gilbertn@reno.gov and include the case number LDC25-00057 so your comment is filed with the application.',
      'Read the application yourself at Onenv.us. Choose the Planning tab, enter LDC25-00057 in the Record Number field, then open Record Info and Attachments.',
      'Speak at the Reno Planning Commission hearing once it is scheduled, or send written comment beforehand.',
      'Contact your Reno City Council member, since the Council takes the final vote.',
    ],
    materials: { label: 'City of Reno planning records (Onenv.us)', url: 'https://onenv.us' },
    lastVerified: '2026-11-05',
  },
];

export function localActionBySlug(slug: string): LocalAction | undefined {
  return LOCAL_ACTIONS.find((a) => a.slug === slug);
}
