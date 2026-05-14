/** @type {import('next').NextConfig} */
const nextConfig = {
  // allowedDevOrigins is a dev-only setting for CORS on the HMR WebSocket.
  // It is ignored in production builds (Vercel, Railway, etc.).
  ...(process.env.NODE_ENV !== 'production' && {
    allowedDevOrigins: [
      '*.replit.dev',
      '*.repl.co',
      '*.pike.replit.dev',
      '*.worf.replit.dev',
      'localhost',
      '127.0.0.1',
    ],
  }),
};

module.exports = nextConfig;
