/**
 * Message-first envelope: wraps the constituent's APPROVED core (never
 * altered) with a greeting, an official-specific relevance line, the
 * intent-correct ask, and a signature. Deterministic — no second AI pass,
 * no per-official hallucination risk. Shared by campaign participation and
 * the general contact flow.
 */
import type { Official } from '@/lib/types';
import { salutationTitle } from '@/lib/utils';

export interface OfficialMessage {
  subject: string;
  body: string;
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
  }
): OfficialMessage {
  const lastName = official.lastName || official.name.split(' ').pop() || official.name;
  const sal = salutationTitle(official.title);
  const target = opts.billRef ?? 'this issue';
  const voteWord = opts.verb === 'oppose' ? 'no' : 'yes';

  let subject: string;
  let opener: string;
  let closer: string;
  if (opts.intent === 'thank') {
    subject = opts.billRef ? `Thank you for standing with us on ${opts.billRef}` : 'Thank you for your leadership';
    opener = `Thank you for your support on ${target}. As your constituent, I wanted you to hear directly that it matters.`;
    closer = 'Thank you again for your leadership, and please keep championing this.';
  } else {
    subject = opts.billRef
      ? opts.stageGoal === 'cosponsor'
        ? `Please cosponsor ${opts.billRef}`
        : `Please ${opts.verb === 'oppose' ? 'oppose' : 'support'} ${opts.billRef}`
      : opts.coreSubject?.trim() ||
        (opts.city
          ? `From your constituent in ${opts.city}: ${opts.headline.slice(0, 60)}`
          : `From your constituent: ${opts.headline.slice(0, 60)}`);
    if (opts.committeeName) {
      opener = `As a member of the ${opts.committeeName}, you are one of the few people deciding what happens to ${target}.`;
    } else if (opts.stageGoal === 'floor_house' || opts.stageGoal === 'floor_senate') {
      opener = `${target} is coming to your chamber for a vote, and your vote is the one that speaks for me.`;
    } else {
      opener = `I am writing to you as your constituent because your vote speaks for me on ${target}.`;
    }
    if (opts.stageGoal === 'cosponsor' && opts.billRef) {
      closer = `I respectfully ask you to cosponsor ${opts.billRef}.`;
    } else if (opts.committeeName) {
      closer = `I respectfully ask you to vote ${voteWord} when it comes before your committee.`;
    } else if (opts.billRef && opts.verb) {
      closer = `I respectfully ask you to vote ${voteWord} on ${opts.billRef}.`;
    } else {
      closer = `I respectfully ask for your ${opts.verb === 'oppose' ? 'opposition to this' : 'support on this'}.`;
    }
  }

  return {
    subject,
    body: `Dear ${sal} ${lastName},\n\n${opener}\n\n${core}\n\n${closer}\n\nSincerely,\n${opts.senderName}\n${opts.city}, ${opts.stateCode} ${opts.zip}`,
  };
}

