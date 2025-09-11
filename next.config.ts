import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)", 
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  images: {
    domains: ["localhost", "images.pexels.com", "workdrive.zohopublic.in"],
  },
};

// Sentry configuration
module.exports = withSentryConfig(nextConfig, {
  org: "worldvisa-dms",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  disableLogger: true,
});
