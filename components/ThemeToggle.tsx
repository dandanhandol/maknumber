"use client";

// 다크/라이트 테마 토글. 첫 paint 는 layout.tsx 의 inline script 가 시스템
// prefers-color-scheme 을 따라 .dark 클래스를 부여하고, 이후 사용자가 이
// 버튼으로 그 세션 동안만 전환한다. 영구 저장은 하지 않으므로 새로고침 시
// 다시 시스템 추종으로 돌아간다(CLAUDE.md §🔒 — 영구 저장 금지).

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  // SSR 시점에는 아직 결정 불가 → mount 후 .dark 클래스 유무로 동기화.
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 외부 시스템(DOM의 .dark 클래스)에서 초기 상태를 가져와 동기화.
  // SSR 시에는 결정 불가하므로 mount 후 한 번만 실행하는 mount-effect.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    const root = document.documentElement;
    if (next) root.classList.add("dark");
    else root.classList.remove("dark");
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      // Apple HIG 최소 터치 타깃 44×44pt 충족(size-11 = 2.75rem = 44px).
      className="size-11 rounded-full"
    >
      {/* SSR/hydration 미일치를 피하기 위해 mount 전에는 두 아이콘 모두 숨김. */}
      {mounted ? (
        isDark ? (
          <Sun className="size-4" />
        ) : (
          <Moon className="size-4" />
        )
      ) : (
        <span className="size-4" aria-hidden />
      )}
    </Button>
  );
}
