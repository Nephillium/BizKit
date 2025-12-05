/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '*.replit.dev',
    '*.repl.co',
    '*.kirk.replit.dev',
    '*.picard.replit.dev',
    '*.janeway.replit.dev',
    '*.spock.replit.dev',
  ],
}

export default nextConfig
