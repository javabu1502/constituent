export const PHONE_TIPS = [
  'Introduce yourself and say you are a constituent.',
  'State your issue clearly and briefly.',
  'Share a short personal story if you have one.',
  'Ask for the official\'s position on the issue.',
  'Be polite and thank the staffer for their time.',
  'Ask for the staffer\'s name so you can follow up.',
  'Calls typically last 1-2 minutes. You will usually speak with a staffer, not the official directly.',
] as const;

export const PHONE_SCRIPT_TEMPLATE = `Hi, my name is [YOUR NAME] and I'm a constituent from [CITY/ZIP].

I'm calling about [TOPIC]. [ONE SENTENCE ABOUT WHY THIS MATTERS TO YOU].

I'd like to know [OFFICIAL'S NAME]'s position on this issue and ask them to [YOUR ASK].

Thank you for your time.`;
