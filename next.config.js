/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow Replit preview iframe and proxied domain
  allowedDevOrigins: [
    'dea37767-0a35-4a4e-ba8a-c7bc178fcd3e-00-2guflq0ij1r18.worf.replit.dev',
    '*.replit.dev',
    '*.repl.co',
  ],
};

module.exports = nextConfig;
