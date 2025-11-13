import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // Explicitly load .env.local

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  }
};

export default nextConfig;