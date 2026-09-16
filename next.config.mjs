/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [{ source: "/finance/goal-savings", destination: "/funds/goal-savings", permanent: true }];
  },
  // 애드센스 승인을 위한 설정
  // images: { domains: [] },
};

export default nextConfig;
