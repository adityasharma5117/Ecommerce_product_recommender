/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    domains: ['images.unsplash.com'],
  },
  webpack: (config) => {
    // Suppress Supabase realtime-js critical dependency warnings
    config.module.exprContextCritical = false;
    config.module.unknownContextCritical = false;
    return config;
  },
};

module.exports = nextConfig;
