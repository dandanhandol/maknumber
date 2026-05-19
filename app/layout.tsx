import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://maknumber.vercel.app";
const SITE_TITLE = "막번호 — 1회용 비밀번호 생성기";
const SITE_DESCRIPTION =
  "어차피 다시 안 갈 사이트, 막 쓸 비밀번호를 즉석에서. 100% 클라이언트, 서버 전송·저장·추적 없음.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: "막번호",
  keywords: [
    "비밀번호 생성기",
    "막번호",
    "1회용 비밀번호",
    "랜덤 비밀번호",
    "password generator",
    "강력한 비밀번호",
  ],
  authors: [{ name: "dandanhandol" }],
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "막번호",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "ko_KR",
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 첫 paint 전에 시스템 prefers-color-scheme 을 감지해 .dark 클래스를 부여.
  // 영구 저장은 하지 않으므로(보안 원칙) 매 세션마다 시스템 추종이 시작점이며,
  // 이후 ThemeToggle 로 그 세션 동안만 전환할 수 있다.
  const noFlashScript = `
    (function () {
      try {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        }
      } catch (_) {}
    })();
  `;

  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-gradient-to-b from-background via-background to-muted/40">
        {children}
      </body>
    </html>
  );
}
