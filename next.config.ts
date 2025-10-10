import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      new URL('https://supabase.uroven.pro/storage/v1/object/public/optimized/**/*'),
    ],
  },
};

export default nextConfig;
