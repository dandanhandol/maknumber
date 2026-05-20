"use client";

// 세션 비밀번호 히스토리 영역.
//
// 데스크톱(sm 이상): 가로 카드 스크롤. 즐겨찾기 좌측 고정, 일반 우측 최신순.
// 모바일: 토글 가능 세로 리스트. 기본 접힘(공간 절약).
//
// 메모리 only 원칙은 부모(`page.tsx`)에서 관리하고 이 컴포넌트는 표시·
// 인터랙션만 담당.

import { useMemo, useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import type { PasswordEntry } from "@/types/options";
import { HistoryCard } from "./HistoryCard";

interface Props {
  history: PasswordEntry[];
  currentEntryId: string | null;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

const INFO_TEXT =
  "새로고침하면 모두 사라집니다. 중요한 비밀번호는 미리 복사해두세요.";

export function HistoryList({
  history,
  currentEntryId,
  onSelect,
  onToggleFavorite,
  onRemove,
  onClearAll,
}: Props) {
  // 모바일 토글. 데스크톱(sm 이상)에선 CSS 로 항상 표시.
  const [openOnMobile, setOpenOnMobile] = useState(false);

  // 즐겨찾기 좌측 고정 + 일반 우측 최신순.
  // (히스토리 배열 자체는 최신이 앞 순서로 저장됨.)
  const sorted = useMemo(() => {
    const favorites = history.filter((e) => e.isFavorite);
    const others = history.filter((e) => !e.isFavorite);
    return [...favorites, ...others];
  }, [history]);

  if (history.length === 0) return null;

  const hasNonFavorite = history.some((e) => !e.isFavorite);

  return (
    <section
      className="space-y-2"
      aria-label="이번 세션 비밀번호 히스토리"
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setOpenOnMobile((o) => !o)}
            aria-expanded={openOnMobile}
            aria-controls="history-body"
            className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors sm:cursor-default sm:pointer-events-none"
          >
            <ChevronDown
              className={
                "size-3.5 transition-transform sm:hidden " +
                (openOnMobile ? "rotate-180" : "")
              }
            />
            <span>
              이번 세션 비밀번호
              <span className="ml-1 tabular-nums font-mono text-muted-foreground/70">
                ({history.length})
              </span>
            </span>
          </button>
          {/* button 중첩을 피해 토글 button 옆에 별도 button 으로 둠. */}
          <button
            type="button"
            aria-label="안내"
            title={INFO_TEXT}
            className="p-0.5 rounded hover:bg-muted text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            <Info className="size-3" />
          </button>
        </div>
        {hasNonFavorite && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70 hover:text-foreground transition-colors"
          >
            모두 지우기
          </button>
        )}
      </header>

      <div
        id="history-body"
        className={
          // 모바일: open 일 때만 표시. 데스크톱: 항상 표시(sm:flex).
          // 모바일 = 세로 리스트, 데스크톱 = 가로 스크롤.
          "gap-2 sm:gap-3 sm:flex sm:flex-row sm:overflow-x-auto sm:pb-2 sm:-mx-1 sm:px-1 " +
          (openOnMobile ? "flex flex-col" : "hidden sm:flex")
        }
      >
        {sorted.map((entry) => (
          <HistoryCard
            key={entry.id}
            entry={entry}
            isCurrent={entry.id === currentEntryId}
            onSelect={onSelect}
            onToggleFavorite={onToggleFavorite}
            onRemove={onRemove}
            className="sm:w-56 sm:shrink-0"
          />
        ))}
      </div>
    </section>
  );
}
