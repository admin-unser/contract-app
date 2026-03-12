/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint errors should not block production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Type errors should not block production builds
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    // Fix react-pdf / pdfjs-dist compatibility with Next.js webpack
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
