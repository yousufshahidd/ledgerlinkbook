import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  // trailingSlash: true, // Removed as it might conflict with dynamic route handling in export mode
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true, // Required for next export with next/image
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
