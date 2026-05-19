import type { MetadataRoute } from "next";

// Next.js App Router 가 빌드 시 /sitemap.xml 로 정적 생성한다.
// 막번호는 페이지가 하나뿐이라 단일 엔트리.
// `output: "export"` 와 호환하려면 명시적 force-static 필요.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://maknumber.vercel.app",
      // 정적 export 시점에 결정되는 빌드 날짜.
      lastModified: "2026-05-19",
      changeFrequency: "monthly",
      priority: 1.0,
    },
  ];
}
