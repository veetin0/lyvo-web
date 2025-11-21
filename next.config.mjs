import dotenv from 'dotenv';
import createNextIntlPlugin from 'next-intl/plugin';

dotenv.config({ path: '.env.local' }); // Explicitly load .env.local

const withNextIntl = createNextIntlPlugin('./i18n.ts');

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

export default withNextIntl(nextConfig);