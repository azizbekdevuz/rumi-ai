import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'k.kakaocdn.net' },
      { protocol: 'http', hostname: 'k.kakaocdn.net' },
      { protocol: 'https', hostname: 't1.kakaocdn.net' },
      { protocol: 'http', hostname: 't1.kakaocdn.net' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'http', hostname: 'lh3.googleusercontent.com' },
    ],
  },
};

export default nextConfig;
