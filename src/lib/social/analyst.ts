/**
 * Analyst — stage 8. Pulls engagement metrics for what we've posted, writes
 * them back onto the rows, and records findings to social_playbook (the
 * learning loop's memory): the issue-area diet and which lane engages best.
 */
import { createAdminClient } from '@/lib/supabase';
import { getPostMetrics, type BlueskySession } from './bluesky';

export interface AnalystResult {
  measured: number;
  diet: Record<string, number>;
  bestLane?: { lane: string; avgLikes: number };
}

export async function runAnalyst(session: BlueskySession): Promise<AnalystResult> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - 14 * 24 * 60 * 60_000).toISOString();

  const { data: posts } = await admin
    .from('social_posts')
    .select('id, external_post_id, issue_area, lane')
    .eq('status', 'posted')
    .gte('posted_at', since)
    .not('external_post_id', 'is', null);

  const rows = posts ?? [];
  const uris = rows.map((r) => r.external_post_id as string).filter(Boolean);
  const metrics = await getPostMetrics(session, uris);

  // Write metrics back onto each post.
  let measured = 0;
  const likesByLane: Record<string, { total: number; n: number }> = {};
  const diet: Record<string, number> = {};
  for (const r of rows) {
    const m = metrics[r.external_post_id as string];
    if (m) {
      await admin.from('social_posts').update({ metrics: m }).eq('id', r.id);
      measured++;
      const lane = (r.lane as string) || 'unknown';
      likesByLane[lane] = likesByLane[lane] || { total: 0, n: 0 };
      likesByLane[lane].total += m.likeCount;
      likesByLane[lane].n += 1;
    }
    const issue = (r.issue_area as string) || 'unknown';
    diet[issue] = (diet[issue] || 0) + 1;
  }

  let bestLane: AnalystResult['bestLane'];
  for (const [lane, { total, n }] of Object.entries(likesByLane)) {
    const avg = n ? total / n : 0;
    if (!bestLane || avg > bestLane.avgLikes) bestLane = { lane, avgLikes: avg };
  }

  // Record findings for future runs to read.
  await admin.from('social_playbook').insert([
    { kind: 'metric', content: JSON.stringify({ diet, measured }), metadata: { at: new Date().toISOString() } },
    ...(bestLane
      ? [{ kind: 'finding', content: `Highest-engagement lane: ${bestLane.lane} (avg ${bestLane.avgLikes.toFixed(1)} likes)`, weight: 1 }]
      : []),
  ]);

  return { measured, diet, bestLane };
}
