import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*.csb.app', '*.codesandbox.io'],
  async rewrites() {
    return [
      {
        source: '/parse/:path*',
        destination: 'http://127.0.0.1:1337/parse/:path*',
      },
    ];
  },
};

export default nextConfig;
