import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  basePath: '/appoint_info',
  trailingSlash: true,
  assetPrefix: '/appoint_info',
  distDir: 'out',
  generateBuildId: async () => {
    return 'static'
  }
};

export default nextConfig;
