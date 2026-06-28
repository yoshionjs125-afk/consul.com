/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // The domain core (src/) uses explicit ".js" import specifiers (ESM style).
    // Let webpack resolve those to the actual ".ts" sources.
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default nextConfig;
