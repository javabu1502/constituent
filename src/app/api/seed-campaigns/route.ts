import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

const CAMPAIGNS = [
  {
    slug: 'authorize-military-force-demand-congress-vote-on-iran',
    headline: 'Authorize Military Force: Demand Congress Vote on Iran',
    description:
      'The Constitution gives Congress — not the President — the power to declare war. ' +
      'Before any expansion of military operations in Iran, demand that your representatives ' +
      'hold a formal vote under the War Powers Act. No more blank checks for open-ended conflict.',
    issue_area: 'Armed Forces and National Security',
    issue_subtopic: 'Military Funding',
    target_level: 'federal',
    message_template:
      'I urge you to reassert congressional war powers authority by requiring a full floor vote ' +
      'before any expansion of military operations in Iran. The American people deserve a say ' +
      'through their elected representatives before our nation commits to further military engagement.',
  },
  {
    slug: 'protect-healthcare-restore-aca-subsidies',
    headline: 'Protect Healthcare: Restore ACA Subsidies',
    description:
      'Millions of Americans are at risk of losing affordable health coverage as enhanced ' +
      'Affordable Care Act subsidies expire. Without action, premiums could spike by hundreds ' +
      'of dollars per month. Tell Congress to restore and extend ACA subsidies before families are priced out.',
    issue_area: 'Health',
    issue_subtopic: 'ACA/Obamacare',
    target_level: 'federal',
    message_template:
      'I urge you to act immediately to restore and extend enhanced ACA subsidies. Letting them ' +
      'expire will cause premium spikes that price millions of Americans out of health coverage. ' +
      'Affordable healthcare should not be a partisan issue — families in our district depend on it.',
  },
  {
    slug: 'end-the-shutdown-cycle-pass-a-real-budget',
    headline: 'End the Shutdown Cycle: Pass a Real Budget',
    description:
      'Government shutdowns hurt federal workers, delay critical services, and cost taxpayers ' +
      'billions. After the longest shutdown in U.S. history, Congress must stop governing by ' +
      'crisis. Demand they pass full-year appropriations bills and end the cycle of continuing resolutions.',
    issue_area: 'Economics and Public Finance',
    issue_subtopic: 'Federal Budget',
    target_level: 'federal',
    message_template:
      'I am calling on you to pass full-year appropriations bills and end the destructive cycle of ' +
      'government shutdowns and short-term continuing resolutions. Federal workers, small businesses, ' +
      'and the communities that depend on government services deserve stable, predictable funding.',
  },
  {
    slug: 'humane-immigration-reform',
    headline: 'Humane Immigration Reform',
    description:
      'Our immigration system is broken, and neither enforcement-only nor open-border approaches ' +
      'serve the country well. Tell your representatives to pursue comprehensive immigration reform ' +
      'that secures the border while treating migrants with dignity and creating fair legal pathways.',
    issue_area: 'Immigration',
    issue_subtopic: 'Border Security',
    target_level: 'federal',
    message_template:
      'I urge you to support comprehensive immigration reform that balances strong border security ' +
      'with humane treatment of migrants and asylum seekers. We need real solutions — a pathway for ' +
      'those already contributing to our communities, efficient processing of asylum claims, and ' +
      'enforcement that reflects American values.',
  },
  {
    slug: 'protect-fed-independence',
    headline: 'Protect Fed Independence',
    description:
      'The Federal Reserve must be free to make monetary policy based on economic data, not ' +
      'political pressure from the White House. When politicians try to influence interest rates ' +
      'for short-term gain, it risks inflation and long-term economic instability. Tell Congress to defend Fed independence.',
    issue_area: 'Economics and Public Finance',
    issue_subtopic: 'Inflation',
    target_level: 'federal',
    message_template:
      'I urge you to publicly defend the Federal Reserve\'s independence from White House political ' +
      'pressure. Monetary policy must be guided by economic data, not election cycles. Please support ' +
      'legislation that strengthens institutional safeguards for the Fed\'s autonomy.',
  },
];

export async function GET() {
  const supabase = createAdminClient();
  const results: { headline: string; status: string }[] = [];

  // Find an existing user to use as creator (FK constraint requires a real auth user)
  const { data: users } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
  const creatorId = users?.users?.[0]?.id;
  if (!creatorId) {
    return NextResponse.json({ error: 'No users found to assign as creator' }, { status: 500 });
  }

  for (const campaign of CAMPAIGNS) {
    const { data: existing } = await supabase
      .from('campaigns')
      .select('id')
      .eq('slug', campaign.slug)
      .maybeSingle();

    if (existing) {
      results.push({ headline: campaign.headline, status: 'SKIP (already exists)' });
      continue;
    }

    const { error } = await supabase.from('campaigns').insert({
      creator_id: creatorId,
      ...campaign,
      status: 'active',
      action_count: 0,
    });

    results.push({
      headline: campaign.headline,
      status: error ? `FAIL: ${error.message}` : 'OK',
    });
  }

  return NextResponse.json({ results });
}
