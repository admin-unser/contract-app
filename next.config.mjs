/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Fix react-pdf / pdfjs-dist compatibility with Next.js webpack
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
