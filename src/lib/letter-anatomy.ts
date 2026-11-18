import { STAGE_GOAL_LABELS, type StageGoal } from '@/lib/stages';

/**
 * What a letter from this campaign says, and which parts belong to whom.
 *
 * An organisation sets a headline, an ask and talking points, and what leaves
 * the building is a letter they have never seen. They assume the whole letter
 * is theirs, then find a greeting and a district line they did not write and
 * cannot change, and read it as the product putting words in their mouth.
 *
 * The greeting, the standing line and the signature are ours because an
 * office triages on them and the federal chambers reject mail without them.
 * The substance is the constituent's because an office can tell the
 * difference between a letter a person wrote and one an organisation wrote
 * for them.
 *
 * The sample sentences come from the same pools src/lib/envelope.ts writes
 * from, and are built with the same inputs, so a bill reference or a thank-you
 * action reads here the way it will read in the letter.
 */

export type PartSource = 'fixed' | 'org' | 'default' | 'constituent';

export interface LetterPart {
  label: string;
  source: PartSource;
  /** A real example of this part, not a placeholder. */
  sample: string;
  /** Why it is this way, in the organiser's terms. */
  note: string;
}

export const PART_SOURCE_LABELS: Record<PartSource, string> = {
  fixed: 'Fixed',
  org: 'From your campaign',
  // Tagging a line we generated as the organisation's own is the one mistake
  // this panel cannot make, since whose words these are is the whole question.
  default: 'Ours until you set one',
  constituent: 'The supporter writes this',
};

export function letterAnatomy(opts: {
  billRef?: string | null;
  ask?: string | null;
  headline?: string | null;
  stageGoal?: string | null;
  direction?: string | null;
  committeeName?: string | null;
  /** 'federal' | 'state' | 'local' */
  level?: string | null;
  firstTalkingPoint?: string | null;
}): LetterPart[] {
  const goal = (opts.stageGoal ?? '') as StageGoal;
  const goalLabel = STAGE_GOAL_LABELS[goal];
  const bill = (opts.billRef ?? '').trim();
  // envelope.ts line 263: the opener's topic is the bill reference, never the
  // headline. Passing the headline produced "your vote speaks for me on AB 156
  // passed, thank your legislators", which is not a sentence the app can send.
  const topic = bill || 'this issue';
  const oppose = opts.direction === 'oppose';
  const thanking = goal === 'thank_you';
  const level = opts.level ?? 'federal';

  const parts: LetterPart[] = [];

  parts.push({
    label: 'Greeting',
    source: 'fixed',
    sample: 'Dear Senator Rosen,',
    note: 'The office the supporter was matched to, with the title it uses.',
  });

  // Only state letters carry it: federal chambers verify constituency against
  // the seat themselves and ask that the address stay out of the body.
  if (level === 'state') {
    parts.push({
      label: 'Standing',
      source: 'fixed',
      sample: 'I am a constituent in Assembly District 24.',
      note: 'The district comes from the supporter’s address. Offices check it before anything else, so it is not editable.',
    });
  }

  parts.push({
    label: 'Opening',
    source: 'constituent',
    sample: opts.committeeName
      ? `You sit on the ${opts.committeeName}, which is where ${bill || 'this bill'} is now.`
      : thanking
        ? `Thank you for your support on ${topic}. As your constituent, I wanted you to hear directly that it matters.`
        : `I am writing to you as your constituent because your vote speaks for me on ${topic}.`,
    note: opts.committeeName
      ? 'Committee and floor openings state why this office is the right one to write to. We write those, because an invented committee assignment gets the letter thrown out.'
      : 'Different wording for each supporter, so a hundred letters do not arrive identical.',
  });

  parts.push({
    label: 'Their reason',
    source: 'constituent',
    sample:
      'We pay more for child care than for our mortgage, and my wife turned down a promotion because the new hours had no care options.',
    note: 'The supporter’s own words, drawn from your talking points. Nothing here is changed after they approve it.',
  });

  // envelope.ts line 311: on a committee action the committee closing wins
  // over the organisation's ask, so showing their sentence here would promise
  // a line the letter does not carry.
  const ownAsk = (opts.ask ?? '').trim();
  if (opts.committeeName) {
    parts.push({
      label: 'The ask',
      source: 'fixed',
      sample: `I respectfully ask you to vote ${oppose ? 'no' : 'yes'} when it comes before your committee.`,
      note: 'A committee action closes on the committee vote. Your ask still shapes what the supporter writes above this.',
    });
  } else {
    parts.push({
      label: 'The ask',
      source: ownAsk ? 'org' : 'default',
      sample:
        ownAsk ||
        (thanking
          ? 'Thank you again for your leadership, and please keep championing this.'
          : bill
            ? goal === 'cosponsor'
              ? `I respectfully ask you to cosponsor ${bill}.`
              : `I respectfully ask you to ${oppose ? 'vote against' : 'vote for'} ${bill}.`
            : `I respectfully ask you to ${oppose ? 'oppose' : 'support'} this.`),
      note: ownAsk
        ? 'Your wording, in every letter this action sends.'
        : `Taken from the action${goalLabel ? ` (${goalLabel.toLowerCase()})` : ''}. Set an ask to use your own sentence.`,
    });
  }

  parts.push({
    label: 'Signature',
    source: 'fixed',
    sample: 'Sincerely,\nPat Doe\nReno, NV 89506',
    note:
      level === 'federal'
        ? 'The supporter’s name. On federal mail the address travels in the chamber’s own fields instead of the text.'
        : 'The supporter’s name and the address they entered.',
  });

  return parts;
}

export interface DeliveryRoute {
  label: string;
  detail: string;
}

/**
 * How a finished letter reaches the office, in the order the router tries.
 * Mirrors chooseDeliveryChannel in src/lib/cwc/delivery-router.ts.
 */
export function deliveryRoutes(level?: string | null): DeliveryRoute[] {
  if (level === 'state' || level === 'local') {
    return [
      {
        label: 'Email to the office',
        detail: 'Sent to the address the chamber publishes for that member, under the supporter’s name.',
      },
      {
        label: 'Contact form',
        detail: 'Used where a member publishes a form instead of an address.',
      },
    ];
  }
  return [
    {
      label: 'Communicating With Congress',
      detail:
        'The House and Senate run their own intake system for constituent mail. Almost every office is on it. A letter sent this way lands in the office’s casework queue.',
    },
    {
      label: 'The office’s own contact form',
      detail: 'A small number of Senate offices are not on that system. Their letters go to the office’s published form.',
    },
    {
      label: 'Email',
      detail: 'Used where an office has neither of the above.',
    },
  ];
}

/**
 * Where a letter got to, for an organisation reading its own numbers. The
 * per-message statuses are already recorded; this is the sentence that says
 * what they mean.
 */
export const DELIVERY_CONFIRMATION_NOTE =
  'Every letter carries a status on the message list below. A failed one is retried.';
