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
];
