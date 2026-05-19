"use client";

// 생성된 비밀번호 표시 + 복사/새로만들기 버튼.
//
// 박스 자체는 단순 표시 영역(클릭 트리거 아님). 사용자는 전통적인 방식으로
// 마우스로 텍스트를 드래그·선택해서 복사할 수도 있고, 아래 "복사" 버튼을
// 누를 수도 있다. 복사 시 화면 하단에 토스트가 잠깐 뜬다.
//
// 비밀번호는 props로만 받고 영구 저장하지 않는다(CLAUDE.md §🔒).

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, RefreshCw } from "lucide-react";

interface Props {
  pwd: string;
  onRegenerate: () => void;
}

const COPIED_HOLD_MS = 2000;
const TOAST_HOLD_MS = 1800;

export function PasswordOutput({ pwd, onRegenerate }: Props) {
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(false);

  const handleCopy = async () => {
    if (!pwd) return;
    try {
      await navigator.clipboard.writeText(pwd);
      setCopied(true);
      setToast(true);
      setTimeout(() => setCopied(false), COPIED_HOLD_MS);
      setTimeout(() => setToast(false), TOAST_HOLD_MS);
    } catch {
      // 클립보드 권한 거부 시 조용히 무시. 사용자는 텍스트를 마우스로 직접
      // 선택해 복사할 수 있다.
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border-2 bg-card p-7 sm:p-9 shadow-sm">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
          생성된 비밀번호
        </div>
        <div className="font-mono text-4xl sm:text-5xl break-all leading-[1.15] font-semibold min-h-[3rem] tracking-tight">
          {pwd || (
            <span className="text-muted-foreground text-base font-sans font-normal">
              생성 중…
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
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
      </div>

      {/* 복사 직후 화면 하단 중앙에 잠깐 뜨는 토스트.
          tw-animate-css 의 animate-in / fade-in / slide-in 유틸 사용. */}
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
