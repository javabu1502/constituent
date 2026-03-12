import type { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/supabase';
import { US_STATES } from '@/lib/constants';
import { getAllFederalLegislators } from '@/lib/legislators';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.mydemocracy.app';

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/legislators`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/trends`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/vote`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/campaigns`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/contact`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/terms`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${baseUrl}/guides`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/how-to-contact-your-congressman`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/how-to-contact-your-state-legislators`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/write-effective-letter-to-congress`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/how-a-bill-becomes-law`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/tell-your-story`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/how-to-run-a-successful-campaign`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/how-to-register-to-vote`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/how-to-attend-a-town-hall`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/how-to-get-involved-in-local-politics`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/how-to-track-legislation`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/who-are-my-representatives`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/how-to-vote-in-a-primary-election`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/what-does-my-congressman-do`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/understanding-your-ballot`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/how-congress-votes`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/what-is-gerrymandering`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/constituent-services`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/how-government-spending-works`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/how-to-organize-your-neighbors`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/how-to-testify-at-a-public-hearing`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/news-media-literacy`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/civic-engagement-new-citizens`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/how-to-comment-on-regulations`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/social-media-advocacy`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/executive-orders`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/how-the-supreme-court-works`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/state-vs-federal-power`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/how-to-research-candidates`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/ballot-measures`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/how-to-start-a-petition`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/write-op-ed-letter-to-editor`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/civic-engagement-for-students`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/how-primaries-and-caucuses-work`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/how-impeachment-works`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/how-the-census-works`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/guides/how-local-government-works`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/news`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/regulations`, changeFrequency: 'daily', priority: 0.8 },
  ];

  // Fetch dynamic campaign slugs
  let campaignPages: MetadataRoute.Sitemap = [];
  try {
    const admin = createAdminClient();
    const { data: campaigns } = await admin
      .from('campaigns')
      .select('slug, created_at')
      .order('created_at', { ascending: false });

    if (campaigns) {
      campaignPages = campaigns.map((c) => ({
        url: `${baseUrl}/campaign/${c.slug}`,
        lastModified: c.created_at,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }));
    }
  } catch {
    // Supabase unavailable at build time — skip dynamic campaigns
  }

  // State hub pages (higher priority — comprehensive info hubs)
  const stateHubPages: MetadataRoute.Sitemap = US_STATES.map((s) => ({
    url: `${baseUrl}/states/${s.name.toLowerCase().replace(/\s+/g, '-')}`,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // State legislator pages
  const statePages: MetadataRoute.Sitemap = US_STATES.map((s) => ({
    url: `${baseUrl}/legislators/${s.name.toLowerCase().replace(/\s+/g, '-')}`,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // States index page
  const statesIndexPage: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/states`, changeFrequency: 'monthly', priority: 0.8 },
  ];

  // Individual legislator profile pages
  const repPages: MetadataRoute.Sitemap = getAllFederalLegislators().map((leg) => ({
    url: `${baseUrl}/rep/${leg.id}`,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // /vote/[state] SEO redirect pages
  const voteStatePages: MetadataRoute.Sitemap = US_STATES.map((s) => ({
    url: `${baseUrl}/vote/${s.name.toLowerCase().replace(/\s+/g, '-')}`,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...statesIndexPage, ...stateHubPages, ...voteStatePages, ...statePages, ...repPages, ...campaignPages];
}
