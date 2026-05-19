import type { MetadataRoute } from "next";

// Next.js App Router 가 빌드 시 /robots.txt 로 정적 생성한다.
// 정적 export(`output: "export"`) 와도 호환되려면 명시적 force-static 필요.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://maknumber.vercel.app/sitemap.xml",
    host: "https://maknumber.vercel.app",
  };
}
