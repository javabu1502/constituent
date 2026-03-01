import type { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/supabase';

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

  return [...staticPages, ...campaignPages];
}
