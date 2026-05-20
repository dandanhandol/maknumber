"use client";

// 히스토리 카드 한 장. 데스크톱 가로 스크롤·모바일 세로 리스트 양쪽 모두에서
// 같은 컴포넌트를 사용한다. 폭은 부모(HistoryList) 가 className 으로 결정.
//
// 카드 안 비번은 **마스킹 없이 전체 표시** (사용자 결정 2026-05-20). 길이가
// 길면 `text-xs` + `break-all` 로 자동 줄바꿈.

import { Pencil, Star, X } from "lucide-react";
import type { PasswordEntry } from "@/types/options";

interface Props {
  entry: PasswordEntry;
  isCurrent: boolean;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onRemove: (id: string) => void;
  className?: string;
}

const SCORE_COLOR: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-red-500",
  1: "bg-orange-500",
  2: "bg-amber-500",
  3: "bg-lime-500",
  4: "bg-emerald-500",
};

export function HistoryCard({
  entry,
  isCurrent,
  onSelect,
  onToggleFavorite,
  onRemove,
  className = "",
}: Props) {
  const score = entry.score;
  const fillColor = score !== null ? SCORE_COLOR[score] : "bg-muted";

  return (
    <div
      className={
        "relative rounded-xl border bg-card p-3 transition-all hover:shadow-md " +
        (isCurrent
          ? "ring-2 ring-foreground/30 border-foreground/20 "
          : "") +
        className
      }
    >
      {/* 상단: # 번호 + 강도점 + ⭐/X */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono shrink-0">
            #{entry.index}
          </span>
          <div
            className="flex gap-0.5"
            aria-label={
              score !== null ? `강도 ${score}/4` : "강도 측정 중"
            }
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={
                  "size-1.5 rounded-full " +
                  (score !== null && i <= score ? fillColor : "bg-muted")
                }
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => onToggleFavorite(entry.id)}
            aria-label={entry.isFavorite ? "즐겨찾기 해제" : "즐겨찾기"}
            aria-pressed={entry.isFavorite}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Star
              className={
                "size-3.5 " +
                (entry.isFavorite ? "fill-amber-400 text-amber-400" : "")
              }
            />
          </button>
          <button
            type="button"
            onClick={() => onRemove(entry.id)}
            aria-label={`#${entry.index} 비밀번호 삭제`}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      {/* 중앙: 비번 전체 표시. 클릭 시 메인으로 swap. */}
      <button
        type="button"
        onClick={() => onSelect(entry.id)}
        aria-label={`#${entry.index} 비밀번호 선택`}
        title="클릭해서 메인으로 가져오기"
        className="w-full text-left font-mono text-xs leading-relaxed break-all p-1.5 -mx-1.5 rounded-md hover:bg-muted/50 transition-colors min-h-[3.25rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {entry.value}
      </button>

      {/* 하단: 길이 + 편집됨 라벨 */}
      <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
        <span className="tabular-nums">{entry.length}자</span>
        {entry.isEdited && (
          <span className="inline-flex items-center gap-0.5 text-muted-foreground/70">
            <Pencil className="size-2.5" />
            편집됨
          </span>
        )}
      </div>
    </div>
  );
}
