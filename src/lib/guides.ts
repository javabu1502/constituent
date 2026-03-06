/**
 * Guide entries for site-wide search and the guides index page.
 * Title, description, href, and category.
 */

export type GuideCategory =
  | 'getting-started'
  | 'contacting-officials'
  | 'understanding-government'
  | 'elections-voting'
  | 'community-action';

export const CATEGORY_LABELS: Record<GuideCategory, string> = {
  'getting-started': 'Getting Started',
  'contacting-officials': 'Contacting Officials',
  'understanding-government': 'Understanding Government',
  'elections-voting': 'Elections & Voting',
  'community-action': 'Community Action',
};

export interface GuideEntry {
  title: string;
  description: string;
  href: string;
  category: GuideCategory;
}

export const GUIDES: GuideEntry[] = [
  // Getting Started
  {
    title: 'Who Are My Elected Officials?',
    description: 'Find out who represents you at every level of government — federal, state, and local — and learn how to contact them.',
    href: '/guides/who-are-my-representatives',
    category: 'getting-started',
  },
  {
    title: 'How to Register to Vote',
    description: 'Complete guide to voter registration: online, by mail, and in person. Deadlines, ID requirements, and same-day options by state.',
    href: '/guides/how-to-register-to-vote',
    category: 'getting-started',
  },
  {
    title: 'How to Get Involved in Local Politics',
    description: 'City councils, school boards, ballot initiatives. Practical ways to engage with the government that affects your daily life.',
    href: '/guides/how-to-get-involved-in-local-politics',
    category: 'getting-started',
  },
  {
    title: 'How to Follow the News Without Losing Your Mind',
    description: 'Media literacy tips for evaluating sources, spotting misinformation, and staying informed without burnout.',
    href: '/guides/news-media-literacy',
    category: 'getting-started',
  },
  {
    title: 'Civic Engagement for New Citizens',
    description: 'Your rights and responsibilities after naturalization — registering to vote, jury duty, and getting involved in your community.',
    href: '/guides/civic-engagement-new-citizens',
    category: 'getting-started',
  },

  // Contacting Officials
  {
    title: 'How to Contact Your Elected Officials',
    description: 'Step-by-step guide to reaching your US Representatives and Senators by phone, email, and letter.',
    href: '/guides/how-to-contact-your-congressman',
    category: 'contacting-officials',
  },
  {
    title: 'How to Contact Your State Legislators',
    description: 'Find and contact your state senators and officials. Why state-level advocacy matters.',
    href: '/guides/how-to-contact-your-state-legislators',
    category: 'contacting-officials',
  },
  {
    title: 'Write an Effective Letter to Congress',
    description: 'Structure, tips, and examples for writing messages that congressional offices actually read.',
    href: '/guides/write-effective-letter-to-congress',
    category: 'contacting-officials',
  },
  {
    title: 'Tell Your Story',
    description: 'Why personal stories matter and how to structure them so staffers flag your message for attention.',
    href: '/guides/tell-your-story',
    category: 'contacting-officials',
  },
  {
    title: 'How to Request Help from Your Officials',
    description: 'Congressional casework: how to get free help with Social Security, VA benefits, immigration, IRS issues, and more.',
    href: '/guides/constituent-services',
    category: 'contacting-officials',
  },
  {
    title: 'How to Comment on Federal Regulations',
    description: 'The notice-and-comment process on Regulations.gov: how to find proposed rules and submit effective public comments.',
    href: '/guides/how-to-comment-on-regulations',
    category: 'contacting-officials',
  },
  {
    title: 'How to Use Social Media to Reach Your Officials',
    description: 'Tips for effective advocacy on social platforms — what works, what doesn\'t, and how to amplify your message.',
    href: '/guides/social-media-advocacy',
    category: 'contacting-officials',
  },

  // Understanding Government
  {
    title: 'How a Bill Becomes Law',
    description: 'Understand the legislative process at federal and state levels, plus resources for tracking bills.',
    href: '/guides/how-a-bill-becomes-law',
    category: 'understanding-government',
  },
  {
    title: 'What Does My Elected Official Actually Do?',
    description: 'Legislating, committee work, constituent services, and oversight — what members of Congress do day-to-day.',
    href: '/guides/what-does-my-congressman-do',
    category: 'understanding-government',
  },
  {
    title: 'How Congress Votes and What It Means',
    description: 'Roll call votes, voice votes, key thresholds, and how to look up your official\'s voting record.',
    href: '/guides/how-congress-votes',
    category: 'understanding-government',
  },
  {
    title: 'How Government Spending Works',
    description: 'The federal budget process, mandatory vs. discretionary spending, and where to track how your tax dollars are spent.',
    href: '/guides/how-government-spending-works',
    category: 'understanding-government',
  },
  {
    title: 'What Is Gerrymandering and How Does It Affect You?',
    description: 'How redistricting works, the effects of gerrymandering on elections, and what you can do about it.',
    href: '/guides/what-is-gerrymandering',
    category: 'understanding-government',
  },
  {
    title: 'What Are Executive Orders and How Do They Work?',
    description: 'Presidential executive orders: what they are, how they\'re issued, their legal limits, and how they can be challenged.',
    href: '/guides/executive-orders',
    category: 'understanding-government',
  },
  {
    title: 'How the Supreme Court Works',
    description: 'How cases reach the Supreme Court, how justices are confirmed, and how rulings shape American law.',
    href: '/guides/how-the-supreme-court-works',
    category: 'understanding-government',
  },
  {
    title: 'Understanding State vs. Federal Power',
    description: 'How federalism divides authority between state and federal government, and why it matters for the issues you care about.',
    href: '/guides/state-vs-federal-power',
    category: 'understanding-government',
  },

  // Elections & Voting
  {
    title: 'How to Vote in a Primary Election',
    description: 'Understand open vs. closed primaries, find your primary date, and learn what you need to participate.',
    href: '/guides/how-to-vote-in-a-primary-election',
    category: 'elections-voting',
  },
  {
    title: 'Understanding Your Ballot',
    description: 'Learn how to read your ballot: types of races, ballot measures, judicial retentions, and how to research candidates.',
    href: '/guides/understanding-your-ballot',
    category: 'elections-voting',
  },
  {
    title: 'How to Track Legislation',
    description: 'Tools and strategies for following bills through Congress and your state legislature. Know when to act.',
    href: '/guides/how-to-track-legislation',
    category: 'elections-voting',
  },
  {
    title: 'How to Research Candidates Before You Vote',
    description: 'Where to find voting records, donor data, policy positions, and nonpartisan voter guides for every race on your ballot.',
    href: '/guides/how-to-research-candidates',
    category: 'elections-voting',
  },
  {
    title: 'What Are Ballot Measures and How Should I Vote on Them?',
    description: 'Understand initiatives, referendums, and propositions — how they work and how to evaluate them before you vote.',
    href: '/guides/ballot-measures',
    category: 'elections-voting',
  },

  // Community Action
  {
    title: 'How to Attend a Town Hall',
    description: 'Find town halls, prepare your question, and make your voice heard face-to-face with your officials.',
    href: '/guides/how-to-attend-a-town-hall',
    category: 'community-action',
  },
  {
    title: 'How to Run a Successful Campaign',
    description: 'Create a compelling campaign that rallies others to contact their officials. Tips on headlines, messaging, sharing, and tracking.',
    href: '/guides/how-to-run-a-successful-campaign',
    category: 'community-action',
  },
  {
    title: 'How to Organize Your Neighbors Around an Issue',
    description: 'Build a coalition, run effective meetings, and escalate to elected officials with community organizing strategies.',
    href: '/guides/how-to-organize-your-neighbors',
    category: 'community-action',
  },
  {
    title: 'How to Testify at a Public Hearing',
    description: 'Prepare and deliver testimony at city council, school board, state legislature, and congressional hearings.',
    href: '/guides/how-to-testify-at-a-public-hearing',
    category: 'community-action',
  },
  {
    title: 'How to Start or Sign a Petition',
    description: 'When petitions work, how to create one, collect signatures, and deliver it to decision-makers.',
    href: '/guides/how-to-start-a-petition',
    category: 'community-action',
  },
  {
    title: 'How to Write an Op-Ed or Letter to the Editor',
    description: 'Structure your argument, pitch to local papers, and get published to influence public opinion on the issues you care about.',
    href: '/guides/write-op-ed-letter-to-editor',
    category: 'community-action',
  },
  {
    title: 'Civic Engagement for Students and Young Adults',
    description: 'Campus organizing, internships, pre-registration, and how to build civic habits early.',
    href: '/guides/civic-engagement-for-students',
    category: 'community-action',
  },
];
