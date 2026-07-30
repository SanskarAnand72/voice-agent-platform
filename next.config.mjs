/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type checking is done separately via pnpm type-check
    ignoreBuildErrors: false,
  },
  images: {
    // Enable Next.js image optimization for production
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  // Compress responses
  compress: true,
  // Generate source maps in production for debugging
  productionBrowserSourceMaps: false,
  // Experimental optimizations
  experimental: {
    // Optimize package imports to reduce JS bundle size
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      'recharts',
    ],
  },
}

export default nextConfig
