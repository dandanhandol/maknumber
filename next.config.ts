import type { NextConfig } from "next";

/**
 * 막번호는 100% 클라이언트 사이드로 동작하므로 정적 export 로 빌드한다.
 * - `output: "export"` → 빌드 결과가 `out/` 폴더에 순수 정적 파일로 생성.
 *   Vercel / Netlify / GitHub Pages / S3 등 어떤 정적 호스팅에도 그대로
 *   업로드 가능.
 * - `images: { unoptimized: true }` → 정적 export 시 next/image 최적화
 *   서버를 못 쓰므로 비활성화(현재 코드는 next/image 미사용이지만 안전망).
 * - `trailingSlash: true` → 정적 호스팅 호환성 향상(`/about` → `/about/index.html`).
 */
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
