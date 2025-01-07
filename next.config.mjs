/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack(config, { isServer }) {
      if (!isServer) {
        // Mock 'fs' for the client-side
        config.resolve.fallback = {
          fs: false,
        };
      }
      return config;
    },
  };
  
  export default nextConfig;
  
