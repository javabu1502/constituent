// Story starter prompts keyed by issueCategory
export const STORY_PROMPTS: Record<string, string[]> = {
  'Health': [
    'I or a family member has been affected by...',
    'My healthcare costs have impacted our family because...',
    'As someone with a pre-existing condition, I...',
  ],
  'Immigration': [
    'As an immigrant / child of immigrants, my experience...',
    'Immigration policy affects my community because...',
    'I have personally seen the impact of enforcement on...',
  ],
  'Education': [
    'As a parent / student / teacher, I have seen...',
    'School funding in my district has affected...',
    'The cost of higher education has meant that I...',
  ],
  'Environmental Protection': [
    'Environmental issues affect my community because...',
    'I have personally experienced the effects of...',
    'Clean air / water is important to me because...',
  ],
  'Crime and Law Enforcement': [
    'I or someone I know has been directly affected by...',
    'Public safety in my neighborhood matters because...',
    'My experience with the justice system showed me...',
  ],
  'Taxation': [
    'As a taxpayer, the current system affects me because...',
    'Tax policy impacts my small business / family budget by...',
    'I have seen firsthand how tax changes affected...',
  ],
  'Economics and Public Finance': [
    'Rising costs have forced my family to...',
    'As a worker in this economy, I struggle with...',
    'The economic situation in my community means that...',
  ],
  'Housing and Community Development': [
    'Finding affordable housing has been a challenge because...',
    'Rent / mortgage costs have forced me to...',
    'I have seen my neighborhood change due to...',
  ],
  'Social Welfare': [
    'Social Security / Medicare is essential for me because...',
    'Without safety net programs, my family would...',
    'I rely on these programs because...',
  ],
  'Armed Forces and National Security': [
    'As a veteran / military family member...',
    'I have served and experienced firsthand...',
    'National security matters to me because...',
  ],
  'Labor and Employment': [
    'As a worker, my conditions have been affected by...',
    'Wage policies directly impact my family because...',
    'My experience in the workplace showed me...',
  ],
  'Families': [
    'As a parent, childcare costs have meant that...',
    'My family has been directly affected by...',
    'Balancing work and family is challenging because...',
  ],
};

export const DEFAULT_STORY_PROMPTS = [
  'This issue affects my daily life because...',
  'I or someone I know has been impacted by...',
  'In my community, I have seen...',
];
