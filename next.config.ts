import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
