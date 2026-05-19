"use client";

// 위험 패턴 경고 배너. SPEC.md §3 — 매칭이 있으면 빨간 배너로 표시하고
// 사용자에게 재생성을 유도한다. 카테고리는 상위 2개만 노출(노이즈 완화).

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DangerCategory, DangerMatch } from "@/lib/dangerPatterns";

interface Props {
  matches: DangerMatch[];
  onRegenerate: () => void;
}

const CATEGORY_LABEL: Record<DangerCategory, string> = {
  keyboard: "키보드 시퀀스",
  vocab: "흔한 어휘",
  numeric: "숫자 시퀀스",
  repeat: "반복 문자",
  date: "연도 패턴",
};

export function DangerWarning({ matches, onRegenerate }: Props) {
  if (matches.length === 0) return null;
  const top = matches.slice(0, 2);

  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-xl border-l-4 border border-amber-500/40 border-l-amber-500 bg-amber-500/[0.06] dark:bg-amber-500/10 p-3.5 flex items-start gap-3"
    >
      <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1 text-sm min-w-0">
        <div className="font-medium text-amber-700 dark:text-amber-400">
          위험 패턴 감지
        </div>
        <div className="text-foreground/70 mt-0.5 break-words text-xs">
          {top.map((m, i) => (
            <span key={`${m.category}-${m.pattern}`}>
              {i > 0 && ", "}
              <code className="font-mono bg-background border px-1 py-0.5 rounded text-[11px]">
                {m.pattern}
              </code>{" "}
              <span className="text-muted-foreground">
                ({CATEGORY_LABEL[m.category]})
              </span>
            </span>
          ))}
          {" — 재생성을 권장합니다."}
        </div>
      </div>
      <Button
        onClick={onRegenerate}
        size="sm"
        className="shrink-0 bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-amber-950"
      >
        새로 만들기
      </Button>
    </div>
  );
}
