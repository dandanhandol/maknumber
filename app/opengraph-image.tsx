import { ImageResponse } from "next/og";
import fs from "node:fs/promises";
import path from "node:path";

// SNS(카톡/슬랙/X 등) 공유 시 보이는 미리보기 이미지.
// 빌드 시 정적 PNG로 한 번만 생성된다.
//
// 한글 렌더링을 위해 Noto Sans KR(@fontsource/noto-sans-kr)을 ttf/woff 로
// 직접 임베드. 폰트가 누락되면 한글이 □ 로 보이는 사태가 생기므로 필수.

export const alt = "막번호 — 막 쓸 비밀번호, 편하게 막 만들어요";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// 정적 export(`output: "export"`) 와 호환되도록 명시.
export const dynamic = "force-static";

async function loadFont(weight: "600" | "700" | "800"): Promise<Buffer> {
  const fontPath = path.join(
    process.cwd(),
    "node_modules/@fontsource/noto-sans-kr/files",
    `noto-sans-kr-korean-${weight}-normal.woff`,
  );
  return await fs.readFile(fontPath);
}

export default async function Image() {
  const [fontSemiBold, fontBold, fontExtraBold] = await Promise.all([
    loadFont("600"),
    loadFont("700"),
    loadFont("800"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #0b1020 0%, #1a2244 60%, #243366 100%)",
          color: "white",
          fontFamily: "NotoSansKR",
          padding: 80,
        }}
      >
        {/* 자물쇠 카드 */}
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 24,
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 36,
            boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 64 64"
            width="56"
            height="56"
            fill="none"
            stroke="#0a0a0a"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="18" y="28" width="28" height="20" rx="3" />
            <path d="M24 28 V22 a8 8 0 0 1 16 0 V28" />
          </svg>
        </div>

        <div
          style={{
            fontSize: 104,
            fontWeight: 800,
            letterSpacing: -3,
            marginBottom: 18,
            lineHeight: 1,
          }}
        >
          막번호
        </div>

        <div
          style={{
            fontSize: 38,
            fontWeight: 600,
            opacity: 0.85,
            marginBottom: 56,
            textAlign: "center",
          }}
        >
          막 쓸 비밀번호, 편하게 막 만들어요
        </div>

        {/* 비번 미리보기 박스 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontFamily: "monospace",
            fontSize: 60,
            fontWeight: 700,
            padding: "24px 52px",
            background: "rgba(255,255,255,0.08)",
            borderRadius: 24,
            border: "2px solid rgba(255,255,255,0.18)",
            letterSpacing: 2,
            color: "#fafafa",
          }}
        >
          kX3$mP9aWq2!
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 36,
            fontSize: 22,
            fontWeight: 600,
            opacity: 0.5,
            letterSpacing: 1,
          }}
        >
          maknumber.vercel.app
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "NotoSansKR", data: fontSemiBold, style: "normal", weight: 600 },
        { name: "NotoSansKR", data: fontBold, style: "normal", weight: 700 },
        {
          name: "NotoSansKR",
          data: fontExtraBold,
          style: "normal",
          weight: 800,
        },
      ],
    },
  );
}
