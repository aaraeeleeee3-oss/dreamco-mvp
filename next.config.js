/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com'] },
  experimental: { serverComponentsExternalPackages: ['@supabase/ssr'] },
};

module.exports = nextConfig;
