import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@modelcontextprotocol/sdk'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // 보안 헤더 설정
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // XSS 공격 방지
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // 클릭재킹 방지
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Referrer 정보 제한
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // HTTPS 강제 (HSTS)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // 권한 정책 (카메라, 마이크 등 제한)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), geolocation=(), microphone=(self)',
          },
        ],
      },
      // API 경로에 대한 추가 보안 헤더
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
