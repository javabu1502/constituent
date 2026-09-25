import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({ createAdminClient: vi.fn() }));
vi.mock('@/lib/insights', () => ({ getCachedInsights: vi.fn() }));

import { assembleCampaignReport, type ReportSourceRows } from '../report';

const NOW = new Date('2026-08-10T12:00:00Z').getTime();

const campaign = {
  id: 'c1',
  slug: 'test-campaign',
  headline: 'Test campaign',
  org_name: null,
  is_official: true,
  direction: null,
  campaign_type: 'advocacy',
  support_count: 0,
  oppose_count: 0,
  created_at: '2026-07-01T00:00:00Z',
};

function msg(overrides: Partial<ReportSourceRows['messages'][number]> = {}) {
  return {
    legislator_name: 'Rep. Jane Doe',
    legislator_party: 'Democratic',
    legislator_level: 'federal',
    legislator_chamber: 'house',
    advocate_city: 'Reno',
    advocate_state: 'NV',
    delivery_method: 'email',
    message_intent: null,
    created_at: '2026-08-09T00:00:00Z',
    ...overrides,
  };
}

function emptyRows(): ReportSourceRows {
  return { messages: [], actions: [], stories: null, socialPosts: [], insights: null, stages: null, orgEffort: null, coalition: null };
}

describe('assembleCampaignReport', () => {
  it('returns null blocks when there is no data behind them', () => {
    const report = assembleCampaignReport(campaign, emptyRows(), NOW);
    expect(report.parties).toBeNull();
    expect(report.officialLevels).toBeNull();
    expect(report.delivery).toEqual([]);
    expect(report.storyImpact).toBeNull();
    expect(report.social).toBeNull();
  });

  it('buckets official parties by prefix and skips missing ones', () => {
    const rows = emptyRows();
    rows.messages = [
      msg({ legislator_party: 'Democratic' }),
      msg({ legislator_party: 'D' }),
      msg({ legislator_party: 'DFL' }),
      msg({ legislator_party: 'Republican' }),
      msg({ legislator_party: 'R' }),
      msg({ legislator_party: 'Independent' }),
      msg({ legislator_party: 'Nonpartisan' }),
      msg({ legislator_party: null }),
      msg({ legislator_party: '' }),
    ];
    const report = assembleCampaignReport(campaign, rows, NOW);
    expect(report.parties).toEqual({ democratic: 3, republican: 2, other: 2 });
  });

  it('counts distinct officials by level, not messages', () => {
    const rows = emptyRows();
    rows.messages = [
      msg({ legislator_name: 'Sen. A', legislator_level: 'federal' }),
      msg({ legislator_name: 'Sen. A', legislator_level: 'federal' }),
      msg({ legislator_name: 'Rep. B', legislator_level: 'federal' }),
      msg({ legislator_name: 'Asm. C', legislator_level: 'state' }),
    ];
    const report = assembleCampaignReport(campaign, rows, NOW);
    expect(report.officialLevels).toEqual({ federal: 2, state: 1 });
  });

  it('aggregates delivery channels descending and drops untracked messages', () => {
    const rows = emptyRows();
    rows.messages = [
      msg({ delivery_method: 'webform' }),
      msg({ delivery_method: 'email' }),
      msg({ delivery_method: 'email' }),
      msg({ delivery_method: null }),
    ];
    const report = assembleCampaignReport(campaign, rows, NOW);
    expect(report.delivery).toEqual([
      { method: 'email', count: 2 },
      { method: 'webform', count: 1 },
    ]);
  });

  it('splits message intents and stays null when untracked', () => {
    const rows = emptyRows();
    rows.messages = [msg({ message_intent: 'persuade' }), msg({ message_intent: 'persuade' }), msg({ message_intent: 'thank' }), msg()];
    expect(assembleCampaignReport(campaign, rows, NOW).intents).toEqual({ persuade: 2, thank: 1 });
    const untracked = emptyRows();
    untracked.messages = [msg(), msg()];
    expect(assembleCampaignReport(campaign, untracked, NOW).intents).toBeNull();
  });

  it('rolls up story attribution, consented uses, and states', () => {
    const rows = emptyRows();
    rows.stories = [
      {
        attribution_level: 'named',
        storyteller_email: 'a@example.com',
        state: 'nv',
        consent_usage_snapshot: { granted_uses: ['shared_with_media', 'contact_me_followup'] },
        created_at: '2026-07-05T00:00:00Z',
      },
      {
        attribution_level: 'first_name_only',
        storyteller_email: null,
        state: 'NV',
        // contact granted but no email on file -> NOT contactable
        consent_usage_snapshot: { granted_uses: ['contact_me_followup'] },
        created_at: '2026-07-20T00:00:00Z',
      },
      { attribution_level: 'anonymous', storyteller_email: null, state: 'CA', consent_usage_snapshot: null, created_at: '2026-08-01T00:00:00Z' },
    ];
    const report = assembleCampaignReport({ ...campaign, campaign_type: 'storytelling' }, rows, NOW);
    expect(report.storyImpact).toEqual({
      total: 3,
      named: 1,
      firstNameOnly: 1,
      anonymous: 1,
      pressReady: 1,
      contactable: 1,
      statesReached: 2, // nv and NV normalize to one state
    });
  });

  it('storytelling reports count stories as participation and geography', () => {
    const rows = emptyRows();
    rows.stories = [
      { attribution_level: 'named', storyteller_email: null, state: 'NV', consent_usage_snapshot: null, created_at: '2026-07-05T00:00:00Z' },
      { attribution_level: 'anonymous', storyteller_email: null, state: 'CA', consent_usage_snapshot: null, created_at: '2026-08-01T00:00:00Z' },
    ];
    const report = assembleCampaignReport({ ...campaign, campaign_type: 'storytelling' }, rows, NOW);
    expect(report.reach.constituents).toBe(2);
    expect(report.reach.statesReached).toBe(2);
    expect(report.growth[report.growth.length - 1].cumulative).toBe(2);
  });

  it('sums social metrics and tolerates posts with none yet', () => {
    const rows = emptyRows();
    rows.socialPosts = [
      { metrics: { likeCount: 5, repostCount: 2, replyCount: 1 } },
      { metrics: { likeCount: 3 } },
      { metrics: null },
    ];
    const report = assembleCampaignReport(campaign, rows, NOW);
    expect(report.social).toEqual({ posts: 3, likes: 8, reposts: 2, replies: 1 });
  });

  it('builds a cumulative growth series ending at the participation total', () => {
    const rows = emptyRows();
    rows.actions = [
      { participant_city: 'Reno', participant_state: 'NV', messages_sent: 1, created_at: '2026-07-02T00:00:00Z' },
      { participant_city: 'Reno', participant_state: 'NV', messages_sent: 1, created_at: '2026-07-15T00:00:00Z' },
      { participant_city: 'Vegas', participant_state: 'NV', messages_sent: 1, created_at: '2026-08-09T00:00:00Z' },
    ];
    const report = assembleCampaignReport(campaign, rows, NOW);
    expect(report.growth.length).toBeGreaterThan(0);
    expect(report.growth.length).toBeLessThanOrEqual(31);
    // Monotonically non-decreasing, ending at the total.
    for (let i = 1; i < report.growth.length; i++) {
      expect(report.growth[i].cumulative).toBeGreaterThanOrEqual(report.growth[i - 1].cumulative);
    }
    expect(report.growth[report.growth.length - 1].cumulative).toBe(3);
    expect(report.reach.last30Days).toBe(2);
  });

  it('passes the stage funnel through for parent campaigns', () => {
    const rows = emptyRows();
    rows.stages = [
      { slug: 'stage-cosponsor', headline: 'Get to 20 cosponsors', goal: 'cosponsor', constituents: 40, messages: 55 },
      { slug: 'stage-committee', headline: 'Pass Energy & Commerce', goal: 'committee', constituents: 12, messages: 18 },
    ];
    const report = assembleCampaignReport(campaign, rows, NOW);
    expect(report.stages).toHaveLength(2);
    expect(report.stages![0].goal).toBe('cosponsor');
  });

  it('passes org effort (meetings + whip) through for the direct-advocacy section', () => {
    const rows = emptyRows();
    rows.orgEffort = { meetings: 14, hours: 9.5, whip: { yes: 5, leaning_yes: 3, uncommitted: 4, leaning_no: 1, no: 2 } };
    const report = assembleCampaignReport(campaign, rows, NOW);
    expect(report.orgEffort?.meetings).toBe(14);
    expect(report.orgEffort?.hours).toBe(9.5);
    expect(report.orgEffort?.whip?.leaning_yes).toBe(3);
  });

  it('judges outcome against the campaign goal (oppose + dead bill = win)', () => {
    const passSupport = assembleCampaignReport({ ...campaign, direction: 'support' as const, outcome: 'passed' }, emptyRows(), NOW);
    expect(passSupport.outcome).toEqual({ result: 'passed', note: null, goalMet: true });
    const killOppose = assembleCampaignReport({ ...campaign, direction: 'oppose' as const, outcome: 'died_committee' }, emptyRows(), NOW);
    expect(killOppose.outcome?.goalMet).toBe(true);
    const lostOppose = assembleCampaignReport({ ...campaign, direction: 'oppose' as const, outcome: 'passed' }, emptyRows(), NOW);
    expect(lostOppose.outcome?.goalMet).toBe(false);
    expect(assembleCampaignReport(campaign, emptyRows(), NOW).outcome).toBeNull();
  });

  it('keeps the report JSON-serializable end to end', () => {
    const rows = emptyRows();
    rows.messages = [msg()];
    rows.socialPosts = [{ metrics: { likeCount: 1, repostCount: 0, replyCount: 0 } }];
    const report = assembleCampaignReport(campaign, rows, NOW);
    expect(JSON.parse(JSON.stringify(report))).toEqual(report);
  });
});
