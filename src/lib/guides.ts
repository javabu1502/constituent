/**
 * Guide entries for site-wide search and the guides index page.
 * Title, description, and href only — icons are added in the page component.
 */

export interface GuideEntry {
  title: string;
  description: string;
  href: string;
}

export const GUIDES: GuideEntry[] = [
  {
    title: 'How to Contact Your Congressman',
    description: 'Step-by-step guide to reaching your US Representatives and Senators by phone, email, and letter.',
    href: '/guides/how-to-contact-your-congressman',
  },
  {
    title: 'How to Contact Your State Legislators',
    description: 'Find and contact your state senators and representatives. Why state-level advocacy matters.',
    href: '/guides/how-to-contact-your-state-legislators',
  },
  {
    title: 'Write an Effective Letter to Congress',
    description: 'Structure, tips, and examples for writing messages that congressional offices actually read.',
    href: '/guides/write-effective-letter-to-congress',
  },
  {
    title: 'How a Bill Becomes Law',
    description: 'Understand the legislative process at federal and state levels, plus resources for tracking bills.',
    href: '/guides/how-a-bill-becomes-law',
  },
  {
    title: 'Tell Your Story',
    description: 'Why personal stories matter and how to structure them so staffers flag your message for attention.',
    href: '/guides/tell-your-story',
  },
  {
    title: 'How to Register to Vote',
    description: 'Complete guide to voter registration: online, by mail, and in person. Deadlines, ID requirements, and same-day options by state.',
    href: '/guides/how-to-register-to-vote',
  },
  {
    title: 'How to Attend a Town Hall',
    description: 'Find town halls, prepare your question, and make your voice heard face-to-face with your representatives.',
    href: '/guides/how-to-attend-a-town-hall',
  },
  {
    title: 'How to Get Involved in Local Politics',
    description: 'City councils, school boards, ballot initiatives. Practical ways to engage with the government that affects your daily life.',
    href: '/guides/how-to-get-involved-in-local-politics',
  },
  {
    title: 'How to Track Legislation',
    description: 'Tools and strategies for following bills through Congress and your state legislature. Know when to act.',
    href: '/guides/how-to-track-legislation',
  },
  {
    title: 'How to Run a Successful Campaign',
    description: 'Create a compelling campaign that rallies others to contact their representatives. Tips on headlines, messaging, sharing, and tracking.',
    href: '/guides/how-to-run-a-successful-campaign',
  },
  {
    title: 'Who Are My Representatives?',
    description: 'Find out who represents you at every level of government — federal, state, and local — and learn how to contact them.',
    href: '/guides/who-are-my-representatives',
  },
  {
    title: 'How to Vote in a Primary Election',
    description: 'Understand open vs. closed primaries, find your primary date, and learn what you need to participate.',
    href: '/guides/how-to-vote-in-a-primary-election',
  },
  {
    title: 'What Does My Congressman Actually Do?',
    description: 'Legislating, committee work, constituent services, and oversight — what members of Congress do day-to-day.',
    href: '/guides/what-does-my-congressman-do',
  },
  {
    title: 'Understanding Your Ballot',
    description: 'Learn how to read your ballot: types of races, ballot measures, judicial retentions, and how to research candidates.',
    href: '/guides/understanding-your-ballot',
  },
  {
    title: 'How Congress Votes and What It Means',
    description: 'Roll call votes, voice votes, key thresholds, and how to look up your representative\'s voting record.',
    href: '/guides/how-congress-votes',
  },
  {
    title: 'What Is Gerrymandering and How Does It Affect You?',
    description: 'How redistricting works, the effects of gerrymandering on elections, and what citizens can do about it.',
    href: '/guides/what-is-gerrymandering',
  },
  {
    title: 'How to Request Help from Your Rep',
    description: 'Congressional casework: how to get free help with Social Security, VA benefits, immigration, IRS issues, and more.',
    href: '/guides/constituent-services',
  },
  {
    title: 'How Government Spending Works',
    description: 'The federal budget process, mandatory vs. discretionary spending, and where to track how your tax dollars are spent.',
    href: '/guides/how-government-spending-works',
  },
  {
    title: 'How to Organize Your Neighbors Around an Issue',
    description: 'Build a coalition, run effective meetings, and escalate to elected officials with community organizing strategies.',
    href: '/guides/how-to-organize-your-neighbors',
  },
  {
    title: 'How to Testify at a Public Hearing',
    description: 'Prepare and deliver testimony at city council, school board, state legislature, and congressional hearings.',
    href: '/guides/how-to-testify-at-a-public-hearing',
  },
];
