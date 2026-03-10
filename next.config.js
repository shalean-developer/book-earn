/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Export the app as a fully static site
  output: 'export',
  // Emit the static export into the "dist" folder
  distDir: 'dist',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

module.exports = nextConfig;

