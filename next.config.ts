import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    /**
     * The only render-blocking resource is the Tailwind sheet. Inlining it into
     * the HTML removes the request waterfall (HTML -> CSS) for first-time
     * visitors on the one page this app has.
     */
    inlineCss: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
