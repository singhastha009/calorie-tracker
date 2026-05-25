/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // better-sqlite3 is a native module; keep it server-only
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
};

module.exports = nextConfig;
