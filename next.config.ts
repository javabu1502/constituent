import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // /campaigns was the organisation landing page. The nav called it
        // "For Organizations" while the URL read like a public directory,
        // which is the link a prospect gets sent. Permanent, because it is
        // indexed and may be in someone's email already.
        source: '/campaigns',
        destination: '/for-organizations',
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'bioguide.congress.gov' },
      { protocol: 'https', hostname: 'theunitedstates.io' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
      { protocol: 'https', hostname: '*.googleapis.com' },
      { protocol: 'https', hostname: '*.openstates.org' },
    ],
  },
};

export default nextConfig;
