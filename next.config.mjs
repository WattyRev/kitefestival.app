/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.watchOptions = {
        poll: 1000,         // Check for changes every second
        aggregateTimeout: 300, // Delay the rebuild slightly
      };
    }
    return config;
  },
};

export default nextConfig;