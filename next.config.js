/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import('next').NextConfig} */
const config = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/a/**",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Add font files to the bundle
    config.module.rules.push({
      test: /\.(afm)$/,
      type: 'asset/resource'
    });
    
    return config;
  },
  cookies: {
    secure: process.env.NODE_ENV === "production",
  },
};

export default config;
