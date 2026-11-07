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
  /** The campaign that carries the guided comment flow, if one exists. */
  campaignSlug?: string;
  /**
   * 'oppose' or 'support' makes the page one-way, the way an advocacy
   * campaign is. 'neutral' offers both and suggests nothing, the way an
   * official weigh-in does.
   */
  stance: 'oppose' | 'support' | 'neutral';
  /** Whose position it is. Required whenever stance is not neutral. */
  stanceOwner?: string;
  /**
   * Points a commenter can attach, each with where it comes from. A comment
   * on a land-use case enters a public record, so a point a resident did not
   * check is a liability to them, not just to us.
   */
  talkingPoints: { point: string; basis: string; source?: LocalActionSource }[];
  /** A few short questions. The answers are the comment. */
  interview: { id: string; question: string; hint: string }[];
  changes: LocalDesignationChange[];
  deciders: LocalDecider[];
  /** What has already happened, newest last. */
  timeline: { date: string; event: string }[];
  status: string;
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
    projectName: 'Peavine Peak Trails Business Park',
    applicant: 'Castello-Monkarsh Development LLC',
    title: 'A hearing on 329 acres beside Horizon Hills is set for November 19',
    summary:
      'About 329 acres on the slope below Peavine Peak, next to the Horizon Hills neighborhood. The applicant wants the land rezoned for industry and open space, under the name Peavine Peak Trails Business Park. Much of it is designated for housing today. Horizon Hills was evacuated in August 2026 when the Hawk Fire came through, and residents say Seneca Drive is the only way in and out. The Planning Commission hears it on November 19.',
    location:
      'About 329.23 acres north of Seneca Drive, west of the end of Blackfoot Way, south of the Union Pacific Railroad spur, running northwest for roughly 1.85 miles toward Peavine Peak Road. Ward 4.',
    parcels: ['082-180-77', '082-180-78', '082-083-10', '082-083-07'],
    requests: [
      'A Master Plan Amendment changing the land use designations across the site.',
      'A Zoning Map Amendment placing all 329.23 acres in a Specific Plan District (SPD).',
    ],
    // The address the city names for comments that enter the record. The
    // case planner handles questions about the process, which is a different
    // thing, and a comment sent there is not the same as one on the record.
    plannerEmail: 'PCPublicComment@reno.gov',
    campaignSlug: 'seneca-hills-rezoning',
    stance: 'oppose',
    stanceOwner: 'North Valleys residents organizing against the application',
    talkingPoints: [
      {
        point:
          'The Hawk Fire burned 15,085 acres across the North Valleys starting August 22, 2026, and destroyed 47 homes, which the state insurance commission recorded as the most destructive wildfire in Nevada. Horizon Hills was among the neighborhoods evacuated.',
        basis: 'News coverage',
        source: { label: 'KUNR', url: 'https://www.kunr.org/hawk-fire' },
      },
      {
        point:
          'Residents of Horizon Hills describe a single route in and out, which congested during that evacuation while emergency vehicles were trying to get in.',
        basis: 'Residents’ account, not a city finding',
      },
      {
        point:
          'The application roughly doubles the industrial land on the site, from 75.95 acres to 156.80 acres.',
        basis: 'The city’s public notice for the case',
      },
      {
        point:
          'Industrial development of that size puts truck and commute traffic on the same roads the neighborhood uses to leave in an emergency.',
        basis: 'A concern to raise, not an established finding',
      },
      {
        point:
          'The application removes the designations that currently allow housing here: 72.72 acres of Large-Lot Neighborhood and 75.95 acres of Suburban Mixed-Use.',
        basis: 'The city’s public notice for the case',
      },
      {
        point:
          'A Specific Plan District lets the city write conditions for this site. Conditions on evacuation routing, road capacity and fire access could be attached to any approval.',
        basis: 'What an SPD designation allows',
      },
    ],
    interview: [
      {
        id: 'who',
        question: 'Where do you live, and how long have you been there?',
        hint: 'A planner weighs a comment differently when they can see you live with the result.',
      },
      {
        id: 'experience',
        question: 'What did you see or go through during the Hawk Fire?',
        hint: 'Skip if you were not here. Your own account carries more than any statistic.',
      },
      {
        id: 'ask',
        question: 'What do you want the Planning Commission to do?',
        hint: 'Deny it, delay it, or approve it only with specific conditions.',
      },
    ],
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
        contactUrl: 'https://www.reno.gov/PCPublicComment',
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
      { date: 'November 19, 2026', event: 'Reno Planning Commission public hearing, 6:00 PM, Council Chambers at Reno City Hall. Comments received by noon that day go into the record.' },
    ],
    status:
      'The Reno Planning Commission hears this on Thursday November 19, 2026 at 6:00 PM, in the Council Chambers at Reno City Hall, 1 East First Street. Comments received by noon that day are entered into the record. After that the Commission makes a recommendation and the City Council takes the final vote.',
    context: {
      heading: 'Why evacuation keeps coming up',
      body:
        'The Hawk Fire started on August 22, 2026 and burned 15,085 acres across the North Valleys. It destroyed 47 homes and one commercial building, which the state insurance commission recorded as the most destructive wildfire in Nevada. Horizon Hills was evacuated, and residents were not allowed back until the following Wednesday afternoon.',
      source: { label: 'KUNR, Hawk Fire coverage', url: 'https://www.kunr.org/hawk-fire' },
    },
    howToComment: [
      'Email PCPublicComment@reno.gov with LDC25-00057 in the subject. Comments received by noon on November 19 are entered into the record.',
      'Or use the city’s own form at reno.gov/PCPublicComment, which goes to the Planning Commission.',
      'Or mail a letter to City of Reno Planning Division, P.O. Box 1900, Reno, NV 89505, with the case number on it.',
      'Speak at the hearing on November 19 at 6:00 PM, Council Chambers, Reno City Hall, 1 East First Street. Submit a Request to Speak form to the Secretary.',
      'Read the application yourself at Onenv.us. Choose the Planning tab, enter LDC25-00057 in the Record Number field, then open Record Info and Attachments. Staff reports are posted the Friday before the hearing.',
      'Questions about the process go to Nathan Gilbert, the planner on the case, at 775-334-2698.',
    ],
    materials: { label: 'City of Reno planning records (Onenv.us)', url: 'https://onenv.us' },
    lastVerified: '2026-11-05',
  },
];

export function localActionBySlug(slug: string): LocalAction | undefined {
  return LOCAL_ACTIONS.find((a) => a.slug === slug);
}
