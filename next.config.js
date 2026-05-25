/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // better-sqlite3 is a native module; keep it server-only
  serverExternalPackages: ["better-sqlite3"],
};

module.exports = nextConfig;
