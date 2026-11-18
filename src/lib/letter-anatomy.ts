import { STAGE_GOAL_LABELS, type StageGoal } from '@/lib/stages';

/**
 * What a letter from this campaign actually says, and which parts belong to
 * whom.
 *
 * An organisation sets a headline, an ask and talking points, and what leaves
 * the building is a letter they have never seen. The question they ask first
 * is which words are theirs: they assume the whole letter is, then find a
 * greeting and a line of district identification they did not write and
 * cannot change, and read it as the product putting words in their mouth.
 *
 * Both halves of that are deliberate. The greeting, the standing line and the
 * signature are ours because an office triages on them and a chamber rejects
 * mail without them. The substance is the constituent's, written in their own
 * words from the campaign's points, because a letter an organisation wrote
 * for somebody is not advocacy and the offices know the difference.
 *
 * So this names each part and whose it is. The sample sentences are the real
 * ones, drawn from the same pools src/lib/envelope.ts writes from. Every
 * sender's letter is worded differently, which is why this is labelled a
 * sample and not a preview.
 */

export type PartSource = 'fixed' | 'org' | 'constituent';

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
  const subject = (opts.headline ?? 'this issue').trim();
  const oppose = opts.direction === 'oppose';
  const level = opts.level ?? 'federal';

  const parts: LetterPart[] = [];

  parts.push({
    label: 'Greeting',
    source: 'fixed',
    sample: 'Dear Senator Rosen,',
    note: 'Built from the office the supporter was matched to, with the title that office uses.',
  });

  // Only state letters carry it: federal chambers verify constituency against
  // the seat themselves and ask that the address stay out of the body.
  if (level === 'state') {
    parts.push({
      label: 'Standing',
      source: 'fixed',
      sample: 'I am a constituent in Assembly District 24.',
      note: 'The district comes from the supporter’s own address. An office checks this line first, so it cannot be edited or removed.',
    });
  }

  parts.push({
    label: 'Opening',
    source: 'constituent',
    sample: opts.committeeName
      ? `You sit on the ${opts.committeeName}, which is where ${bill || 'this bill'} is now.`
      : `I am writing to you as your constituent because your vote speaks for me on ${subject}.`,
    note: opts.committeeName
      ? 'Committee and floor openings state the fact that makes this office the right one to write to. Those sentences are ours, because an invented committee assignment is a letter the office throws out.'
      : 'Written fresh for each supporter so a hundred letters do not arrive identical. You do not write it, and neither does anyone else twice.',
  });

  parts.push({
    label: 'Their reason',
    source: 'constituent',
    sample:
      'We pay more for child care than for our mortgage, and my wife turned down a promotion because the new hours had no care options.',
    note: 'The supporter’s own words, from your talking points and their own situation. Nothing here is edited after they approve it, and it is the part an office reads.',
  });

  parts.push({
    label: 'The ask',
    source: 'org',
    sample:
      (opts.ask ?? '').trim() ||
      (bill
        ? goal === 'cosponsor'
          ? `I respectfully ask you to cosponsor ${bill}.`
          : `I respectfully ask you to ${oppose ? 'vote against' : 'vote for'} ${bill}.`
        : `I respectfully ask you to ${oppose ? 'oppose' : 'support'} this.`),
    note: opts.ask?.trim()
      ? 'Your wording, in every letter this action sends.'
      : `Written from the action${goalLabel ? ` (${goalLabel.toLowerCase()})` : ''}. Set an ask on the action to use your own sentence instead.`,
  });

  parts.push({
    label: 'Signature',
    source: 'fixed',
    sample: 'Sincerely,\nPat Doe\nReno, NV 89506',
    note:
      level === 'federal'
        ? 'The supporter’s name. On federal mail the address travels in the chamber’s own fields rather than in the text.'
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
        detail:
          'Sent to the address the chamber publishes for that member, from the supporter’s own name, with their address in the signature.',
      },
      {
        label: 'Contact form',
        detail: 'Where a member publishes a form instead of an address, the letter is submitted to the form.',
      },
    ];
  }
  return [
    {
      label: 'Communicating With Congress',
      detail:
        'The House and Senate run their own intake system for constituent mail. Almost every office is on it, and a letter delivered this way arrives in the office’s casework queue rather than a mailbox.',
    },
    {
      label: 'The office’s own contact form',
      detail:
        'A small number of Senate offices are not on that system. Their letters are filled into the office’s published form automatically.',
    },
    {
      label: 'Email',
      detail: 'Used only where neither of the above is available for an office.',
    },
  ];
}

/**
 * Where a letter got to, for an organisation reading its own numbers. The
 * per-message statuses are already recorded; this is the sentence that says
 * what they mean.
 */
export const DELIVERY_CONFIRMATION_NOTE =
  'Each letter’s status is recorded on the message list: submitted, accepted by the chamber, or failed. A failure is retried.';
