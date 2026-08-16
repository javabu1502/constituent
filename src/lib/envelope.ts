/**
 * Message-first envelope: wraps the constituent's APPROVED core (never
 * altered) with a greeting, an official-specific relevance line, the
 * intent-correct ask, and a signature. Shared by campaign participation and
 * the general contact flow.
 *
 * Variance model: at volume, identical frames read as a bot — a legislator
 * who gets a hundred of these will spot one fixed opener instantly. So the
 * opener and the ask are AI-written per SENDER (same call that drafts the
 * core, validated server-side), making every sender's email unique end to
 * end. Deterministic seeded pools remain for (a) fallback when the AI fields
 * are missing and (b) lines that carry facts the AI must not invent
 * (committee membership, floor votes). Pool choice is seeded by the sender so
 * one person's letters are consistent while the population varies.
 */
import type { Official } from '@/lib/types';
import { salutationTitle } from '@/lib/utils';

export interface OfficialMessage {
  subject: string;
  body: string;
}

/** Deterministic per-sender index — djb2 over the sender identity. */
function seededIndex(seed: string, poolSize: number): number {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = ((h * 33) ^ seed.charCodeAt(i)) >>> 0;
  return h % poolSize;
}

const OPENERS_DEFAULT = [
  (t: string) => `I am writing to you as your constituent because your vote speaks for me on ${t}.`,
  (t: string) => `As one of your constituents, I want you to know where I stand on ${t}.`,
  (t: string) => `You represent me, and I wanted to reach you directly about ${t}.`,
  (t: string) => `I live in your district, and ${t} is the issue that moved me to write today.`,
  (t: string) => `I don't write to elected officials often, but ${t} matters enough to me that I am writing now.`,
  (t: string) => `As a constituent, I'm asking you to hear me out on ${t}.`,
  (t: string) => `Your vote is the one that speaks for my household on ${t}, so I wanted you to hear from me directly.`,
  (t: string) => `I'm reaching out as someone you represent, because ${t} affects my family directly.`,
];

const OPENERS_COMMITTEE = [
  (c: string, t: string) => `As a member of the ${c}, you are one of the few people deciding what happens to ${t}.`,
  (c: string, t: string) => `You sit on the ${c}, which means ${t} is in your hands before it reaches anyone else.`,
  (c: string, t: string) => `Because you serve on the ${c}, your voice carries more weight than most on ${t}.`,
  (c: string, t: string) => `${t} is coming before the ${c}, and as a member, you will help decide its fate.`,
  (c: string, t: string) => `Few people have a real say over ${t} right now — as a member of the ${c}, you do.`,
];

const OPENERS_FLOOR = [
  (t: string) => `${t} is coming to your chamber for a vote, and your vote is the one that speaks for me.`,
  (t: string) => `With ${t} headed to the floor, I wanted you to hear from a constituent before you vote.`,
  (t: string) => `You will soon vote on ${t}, and I hope what I share below is part of what you weigh.`,
  (t: string) => `Before ${t} reaches a floor vote, I want my voice counted among your constituents.`,
  (t: string) => `The floor vote on ${t} is your chance to speak for people like me, and I'm asking you to take it.`,
];

const CLOSERS_COSPONSOR = [
  (b: string) => `I respectfully ask you to cosponsor ${b}.`,
  (b: string) => `Please add your name as a cosponsor of ${b}.`,
  (b: string) => `I'm asking you to put your name on ${b} as a cosponsor.`,
  (b: string) => `Cosponsoring ${b} would tell constituents like me that you're listening.`,
  (b: string) => `Please consider becoming a cosponsor of ${b} — it would mean a great deal to me.`,
];

const CLOSERS_COMMITTEE = [
  (v: string) => `I respectfully ask you to vote ${v} when it comes before your committee.`,
  (v: string) => `When your committee takes this up, please vote ${v}.`,
  (v: string) => `Please vote ${v} in committee — that vote matters more than most people realize.`,
  (v: string) => `As this moves through your committee, I'm asking for your ${v} vote.`,
  (v: string) => `Your committee vote is the one I'm counting on — please vote ${v}.`,
];

const CLOSERS_BILL_VOTE = [
  (v: string, b: string) => `I respectfully ask you to vote ${v} on ${b}.`,
  (v: string, b: string) => `When ${b} comes to a vote, please vote ${v}.`,
  (v: string, b: string) => `Please cast a ${v} vote on ${b}.`,
  (v: string, b: string) => `I'm asking you, as my representative, to vote ${v} on ${b}.`,
  (v: string, b: string) => `A ${v} vote on ${b} is what I'm asking of you.`,
];

const CLOSERS_DEFAULT_SUPPORT = [
  `I respectfully ask for your support on this.`,
  `Please stand with constituents like me on this.`,
  `I'm asking for your support, and I'll be watching for it.`,
  `Your support on this would matter to my family and to many of your constituents.`,
  `Please give this your support.`,
  `I hope I can count on your support here.`,
];

const CLOSERS_DEFAULT_OPPOSE = [
  `I respectfully ask for your opposition to this.`,
  `Please stand against this on behalf of constituents like me.`,
  `I'm asking you to oppose this, and I'll be watching for it.`,
  `Your opposition to this would matter to my family and to many of your constituents.`,
  `Please push back on this.`,
  `I hope I can count on you to oppose this.`,
];

const THANKS_OPENERS = [
  (t: string) => `Thank you for your support on ${t}. As your constituent, I wanted you to hear directly that it matters.`,
  (t: string) => `I saw where you stood on ${t}, and I wanted to say thank you — constituents notice.`,
  (t: string) => `As someone you represent, thank you for standing up on ${t}.`,
  (t: string) => `Your support on ${t} did not go unnoticed in my household. Thank you.`,
];

const THANKS_CLOSERS = [
  `Thank you again for your leadership, and please keep championing this.`,
  `Please keep pushing — you have constituents behind you.`,
  `Thank you again. Please see this through to the finish.`,
  `Gratitude is rare in your inbox, I imagine — please know this vote earned it.`,
];

/**
 * Validate an AI-written ask against a campaign's precise ask: it must name
 * the bill and match the direction. Anything off falls back to the pools.
 */
export function validateCampaignAsk(
  ask: string,
  billRef: string | null,
  verb: 'support' | 'oppose' | null,
  stageGoal: string | null | undefined
): boolean {
  const a = (ask || '').trim();
  if (a.length < 10 || a.length > 300) return false;
  if (billRef) {
    const norm = (s: string) => s.toLowerCase().replace(/[.\s]+/g, '');
    if (!norm(a).includes(norm(billRef))) return false;
  }
  if (stageGoal === 'cosponsor') return /cosponsor/i.test(a);
  if (verb === 'oppose') return /(oppose|vote no|against|reject)/i.test(a) && !/(support|vote yes)\b/i.test(a);
  if (verb === 'support') return /(support|vote yes|back|pass|approve)/i.test(a) && !/(oppose|vote no|against)\b/i.test(a);
  return true;
}

export function buildEnvelope(
  core: string,
  official: Official,
  opts: {
    intent?: 'persuade' | 'thank';
    committeeName: string | null;
    verb: 'support' | 'oppose' | null;
    billRef: string | null;
    stageGoal: string | null | undefined;
    headline: string;
    senderName: string;
    city: string;
    stateCode: string;
    zip: string;
    /** AI-drafted subject from the core pass — used only when no bill ref
     * gives us a precise ask to put in the subject line. */
    coreSubject?: string | null;
    /** AI-drafted opening in the sender's voice (no official facts). Used
     * outside committee/floor contexts, where facts require the pools. */
    coreOpening?: string | null;
    /** AI-drafted closing ask in the sender's voice. Campaign asks are only
     * used when validateCampaignAsk passed upstream. */
    coreAsk?: string | null;
  }
): OfficialMessage {
  const lastName = official.lastName || official.name.split(' ').pop() || official.name;
  const sal = salutationTitle(official.title);
  const target = opts.billRef ?? 'this issue';
  const voteWord = opts.verb === 'oppose' ? 'no' : 'yes';
  const seed = `${opts.senderName}|${opts.zip}|${opts.headline}`;
  const pick = <T,>(pool: T[]): T => pool[seededIndex(seed, pool.length)];

  let subject: string;
  let opener: string;
  let closer: string;
  if (opts.intent === 'thank') {
    subject = opts.billRef ? `Thank you for standing with us on ${opts.billRef}` : 'Thank you for your leadership';
    opener = pick(THANKS_OPENERS)(target);
    closer = pick(THANKS_CLOSERS);
  } else {
    subject = opts.billRef
      ? opts.stageGoal === 'cosponsor'
        ? `Please cosponsor ${opts.billRef}`
        : `Please ${opts.verb === 'oppose' ? 'oppose' : 'support'} ${opts.billRef}`
      : opts.coreSubject?.trim() ||
        (opts.city
          ? `From your constituent in ${opts.city}: ${opts.headline.slice(0, 60)}`
          : `From your constituent: ${opts.headline.slice(0, 60)}`);

    // Openers: committee/floor lines carry real facts, so they come from the
    // seeded pools; everywhere else the sender's own AI-written opening wins.
    if (opts.committeeName) {
      opener = pick(OPENERS_COMMITTEE)(opts.committeeName, target);
    } else if (opts.stageGoal === 'floor_house' || opts.stageGoal === 'floor_senate') {
      opener = pick(OPENERS_FLOOR)(target);
    } else {
      opener = opts.coreOpening?.trim() || pick(OPENERS_DEFAULT)(target);
    }

    // Closers: committee asks stay pooled (they reference the committee);
    // otherwise the sender's validated AI ask wins, pools as fallback.
    if (opts.committeeName) {
      closer = pick(CLOSERS_COMMITTEE)(voteWord);
    } else if (opts.coreAsk?.trim()) {
      closer = opts.coreAsk.trim();
    } else if (opts.stageGoal === 'cosponsor' && opts.billRef) {
      closer = pick(CLOSERS_COSPONSOR)(opts.billRef);
    } else if (opts.billRef && opts.verb) {
      closer = pick(CLOSERS_BILL_VOTE)(voteWord, opts.billRef);
    } else {
      closer = pick(opts.verb === 'oppose' ? CLOSERS_DEFAULT_OPPOSE : CLOSERS_DEFAULT_SUPPORT);
    }
  }

  return {
    subject,
    body: `Dear ${sal} ${lastName},\n\n${opener}\n\n${core}\n\n${closer}\n\nSincerely,\n${opts.senderName}\n${opts.city}, ${opts.stateCode} ${opts.zip}`,
  };
}
