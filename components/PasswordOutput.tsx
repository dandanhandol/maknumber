"use client";

// 생성된 비밀번호 표시 + 복사/새로만들기 + 직접 편집 모드.
//
// 두 가지 모드:
//   1. view: 큰 모노 비번 + 우측 상단 ✏️ 편집 진입 버튼
//   2. edit: input 으로 직접 수정 + 카운터 + 문자 구성 + 완료/되돌리기
//
// 편집 state(`editing` / `draft`)는 부모(`page.tsx`)가 관리하고 콜백으로 받는다.
// 강도/위험 패턴 평가도 부모가 디바운스해서 처리(SPEC: 150ms / 200ms).
// 비밀번호는 props 로만 받고 영구 저장하지 않는다(CLAUDE.md §🔒).

import { useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, Pencil, RefreshCw, RotateCcw } from "lucide-react";
import { getComposition, type Composition } from "@/lib/evaluator";
import { MAX_LENGTH, MIN_LENGTH } from "@/types/options";

interface Props {
  pwd: string;
  editing: boolean;
  draft: string;
  onEditStart: () => void;
  onEditChange: (next: string) => void;
  onEditCommit: () => void;
  onEditRevert: () => void;
  onRegenerate: () => void;
}

const COPIED_HOLD_MS = 2000;
const TOAST_HOLD_MS = 1800;

export function PasswordOutput({
  pwd,
  editing,
  draft,
  onEditStart,
  onEditChange,
  onEditCommit,
  onEditRevert,
  onRegenerate,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(false);

  const handleCopy = async () => {
    const target = editing ? draft : pwd;
    if (!target) return;
    try {
      await navigator.clipboard.writeText(target);
      setCopied(true);
      setToast(true);
      setTimeout(() => setCopied(false), COPIED_HOLD_MS);
      setTimeout(() => setToast(false), TOAST_HOLD_MS);
    } catch {
      // 클립보드 권한 거부 시 무시. 사용자가 텍스트를 직접 선택해 복사 가능.
    }
  };

  // 편집 모드 즉시 통계 (composition 은 O(n) 가벼움).
  const draftLength = Array.from(draft).length; // 코드포인트 단위
  const tooShort = draftLength < MIN_LENGTH;
  const composition = editing ? getComposition(draft) : null;

  return (
    <div className="space-y-3">
      <div
        className={
          "rounded-2xl border-2 bg-card px-5 py-6 sm:p-9 shadow-sm relative transition-colors " +
          (editing ? "border-foreground/40 shadow-md" : "")
        }
      >
        {editing ? (
          <EditPanel
            draft={draft}
            onChange={onEditChange}
            onCommit={onEditCommit}
            draftLength={draftLength}
            tooShort={tooShort}
            composition={composition!}
          />
        ) : (
          <ViewPanel pwd={pwd} onEditStart={onEditStart} />
        )}
      </div>

      <div className="flex gap-2">
        {editing ? (
          <>
            <Button
              onClick={onEditCommit}
              variant="default"
              className="flex-1"
              disabled={tooShort}
            >
              <Check className="size-4 mr-2" />
              완료
            </Button>
            <Button onClick={onEditRevert} variant="outline" className="flex-1">
              <RotateCcw className="size-4 mr-2" />
              되돌리기
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={handleCopy}
              variant="default"
              className="flex-1"
              disabled={!pwd}
            >
              {copied ? (
                <Check className="size-4 mr-2" />
              ) : (
                <Copy className="size-4 mr-2" />
              )}
              {copied ? "복사됨" : "복사"}
            </Button>
            <Button onClick={onRegenerate} variant="outline" className="flex-1">
              <RefreshCw className="size-4 mr-2" />
              새로 만들기
            </Button>
          </>
        )}
      </div>

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          role="status"
          aria-live="polite"
        >
          <div className="bg-foreground text-background rounded-full px-4 py-2 text-sm shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <Check className="size-4" />
            클립보드에 복사됐어요
          </div>
        </div>
      )}
    </div>
  );
}

function ViewPanel({
  pwd,
  onEditStart,
}: {
  pwd: string;
  onEditStart: () => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onEditStart}
        disabled={!pwd}
        aria-label="비밀번호 직접 편집"
        title="직접 편집"
        className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
      >
        <Pencil className="size-3.5" />
      </button>
      <div className="font-mono text-3xl sm:text-5xl break-all leading-[1.15] font-semibold min-h-[2.25rem] sm:min-h-[3rem] tracking-tight pr-8">
        {pwd || (
          <span className="text-muted-foreground text-base font-sans font-normal">
            생성 중…
          </span>
        )}
      </div>
    </>
  );
}

function EditPanel({
  draft,
  onChange,
  onCommit,
  draftLength,
  tooShort,
  composition,
}: {
  draft: string;
  onChange: (next: string) => void;
  onCommit: () => void;
  draftLength: number;
  tooShort: boolean;
  composition: Composition;
}) {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !tooShort) onCommit();
  };

  return (
    <>
      <input
        type="text"
        value={draft}
        onChange={(e) => {
          // ASCII 인쇄 가능 범위(0x20–0x7E)만 허용. generator 가 만들 수 있는
          // 문자 풀과 일치. 한글/이모지/제어문자는 즉시 제거되어 사용자에게는
          // "입력이 무시됨"으로 보임 — 한/영 전환을 즉시 인지하도록.
          const filtered = e.target.value.replace(/[^\x20-\x7E]/g, "");
          onChange(filtered);
        }}
        onKeyDown={handleKeyDown}
        autoFocus
        maxLength={MAX_LENGTH}
        // IME 비활성화 시도: lang/inputMode 힌트(브라우저별 효과 차이 있음).
        // 실패해도 위 onChange 필터로 최종 차단됨.
        lang="en"
        inputMode="text"
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        aria-label="비밀번호 편집 (ASCII만)"
        className="font-mono text-3xl sm:text-5xl break-all leading-[1.15] font-semibold tracking-tight bg-transparent border-0 outline-none w-full p-0 min-h-[2.25rem] sm:min-h-[3rem]"
      />
      <div className="mt-3 flex items-center gap-x-3 gap-y-1 flex-wrap text-xs">
        <span
          className={
            "tabular-nums font-mono " +
            (tooShort
              ? "text-amber-600 dark:text-amber-500 font-medium"
              : "text-muted-foreground")
          }
          aria-label={`${draftLength}자, 최대 ${MAX_LENGTH}자`}
        >
          {draftLength}/{MAX_LENGTH}
        </span>
        {tooShort && (
          <span className="text-amber-600 dark:text-amber-500 font-medium">
            사용 불가 (최소 {MIN_LENGTH}자)
          </span>
        )}
        <span className="text-muted-foreground/30">·</span>
        <CompositionChip label="대" value={composition.upper} />
        <CompositionChip label="소" value={composition.lower} />
        <CompositionChip label="숫" value={composition.digit} />
        <CompositionChip label="특" value={composition.symbol} />
        {composition.other > 0 && (
          <CompositionChip label="기타" value={composition.other} />
        )}
      </div>
    </>
  );
}

function CompositionChip({ label, value }: { label: string; value: number }) {
  const dim = value === 0;
  return (
    <span
      className={
        "inline-flex items-baseline gap-0.5 " +
        (dim ? "text-muted-foreground/40" : "text-muted-foreground")
      }
    >
      <span className="text-[10px] uppercase tracking-wider">{label}</span>
      <span className="font-mono tabular-nums font-medium">{value}</span>
    </span>
  );
}
