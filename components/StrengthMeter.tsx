"use client";

// zxcvbn 기반 강도 시각화. score(0~4)에 따라 5칸 게이지를 채운다.
// 측정 결과가 없으면(strength=null) "측정 중…" 표시.

import type { Strength } from "@/types/options";

interface Props {
  strength: Strength | null;
}

// 점수별 게이지 색.
const COLOR_BY_SCORE: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-red-500",
  1: "bg-orange-500",
  2: "bg-amber-500",
  3: "bg-lime-500",
  4: "bg-emerald-500",
};

export function StrengthMeter({ strength }: Props) {
  const score = strength?.score ?? 0;
  const label = strength?.label ?? "측정 중…";
  const crackTime = strength?.crackTimeDisplay ?? "—";
  const fillColor = COLOR_BY_SCORE[score];

  return (
    <div className="space-y-1.5 px-1">
      <div className="flex justify-between items-baseline text-sm">
        <span className="font-medium">
          강도{" "}
          <span className="text-muted-foreground font-normal">· {label}</span>
        </span>
        <span className="text-xs text-muted-foreground">
          예상 크랙 {crackTime}
        </span>
      </div>
      <div
        className="flex gap-1"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={score}
        aria-label={`강도 ${score}/4 ${label}`}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              strength && i <= score ? fillColor : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
