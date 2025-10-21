import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  basePath: '',
  trailingSlash: true,
  assetPrefix: '',
  distDir: 'out',
  generateBuildId: async () => {
    return 'static'
  },
  experimental: {
    esmExternals: false
  }
};

export default nextConfig;
