"use client";

// 막번호 메인 페이지. 모든 상태는 메모리(React state)에만 둔다.
// 영구 저장소 사용 금지(CLAUDE.md §🔒).

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, Lock, ShieldCheck } from "lucide-react";
import type { PasswordOptions, Strength } from "@/types/options";
import { DEFAULT_PRESET_ID, getPreset } from "@/lib/presets";
import { generate, normalizeOptions } from "@/lib/generator";
import { findDangerPatterns } from "@/lib/dangerPatterns";
import { measureStrength } from "@/lib/strength";
import { PresetSelector } from "@/components/PresetSelector";
import { PasswordOptionsForm } from "@/components/PasswordOptions";
import { PasswordOutput } from "@/components/PasswordOutput";
import { StrengthMeter } from "@/components/StrengthMeter";
import { DangerWarning } from "@/components/DangerWarning";
import { ThemeToggle } from "@/components/ThemeToggle";

const INITIAL_OPTIONS = getPreset(DEFAULT_PRESET_ID)!.options;

export default function Home() {
  const [opts, setOpts] = useState<PasswordOptions>(INITIAL_OPTIONS);
  const [presetId, setPresetId] = useState<string | null>(DEFAULT_PRESET_ID);
  // 빈 문자열로 시작해 hydration mismatch를 피하고, mount 후 첫 생성.
  const [pwd, setPwd] = useState<string>("");
  const [strength, setStrength] = useState<Strength | null>(null);
  // 옵션 본문 접힘/펼침. 기본 펼침(사용자 결정 2026-05-19) — 새 사용자가
  // 옵션의 존재를 즉시 인지하도록. 익숙해진 사용자는 접어서 비번 박스를
  // 강조할 수 있다.
  const [optionsOpen, setOptionsOpen] = useState(true);

  // opts와 pwd를 같은 호출에서 함께 갱신해 effect 안의 setState를 피한다
  // (React 19 권장 패턴: setState-in-effect 룰).
  const applyOpts = useCallback((next: PasswordOptions) => {
    setOpts(next);
    setPwd(generate(next));
  }, []);

  const regenerate = useCallback(() => {
    setPwd(generate(opts));
  }, [opts]);

  // Mount 직후 첫 비밀번호 생성. SSR/클라이언트 hydration mismatch를 피하기
  // 위해 useState 초기값은 ""로 두고 클라이언트에서만 첫 generate 실행.
  // 이 한 줄은 외부 시스템 동기화에 가까운 mount 초기화이므로 lint 룰을 끈다.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPwd(generate(INITIAL_OPTIONS));
  }, []);

  // 강도는 비동기(zxcvbn 동적 import). 입력 빠른 변경 시 디바운스.
  // setState는 setTimeout 콜백 안에서 일어나므로 룰에 걸리지 않는다.
  useEffect(() => {
    if (!pwd) return;
    const handle = setTimeout(() => {
      measureStrength(pwd).then(setStrength);
    }, 120);
    return () => clearTimeout(handle);
  }, [pwd]);

  const danger = useMemo(() => findDangerPatterns(pwd), [pwd]);

  const handlePreset = (id: string) => {
    const p = getPreset(id);
    if (!p) return;
    setPresetId(id);
    applyOpts(p.options);
  };

  const handleOptsChange = (next: PasswordOptions) => {
    // 사용자가 옵션을 직접 만지면 프리셋 강조를 해제(사용자 지정 상태).
    setPresetId(null);
    applyOpts(normalizeOptions(next));
  };

  return (
    <main className="container mx-auto max-w-2xl px-4 py-10 sm:py-14 space-y-7">
      <header className="flex items-center gap-3 pb-1">
        <div className="size-10 rounded-xl bg-foreground text-background flex items-center justify-center shadow-sm shrink-0">
          <Lock className="size-5" strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight leading-none">
            막번호
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            막 쓸 비밀번호, 편하게 막 만들어요
          </p>
        </div>
        <ThemeToggle />
      </header>

      <section className="space-y-3">
        <PasswordOutput pwd={pwd} onRegenerate={regenerate} />
        <StrengthMeter strength={strength} />
        <DangerWarning matches={danger} onRegenerate={regenerate} />
      </section>

      <section className="rounded-2xl border bg-card/40 backdrop-blur-sm">
        {/* 프리셋 칩 — 옵션 카드 안 맨 위 줄(2026-05-19: Stage 1.3). */}
        <div className="p-5 sm:p-6">
          <PresetSelector presetId={presetId} onSelect={handlePreset} />
        </div>

        {/* 옵션 본문 토글. 기본은 접힘 — Stage 1.3 결정. */}
        <button
          type="button"
          onClick={() => setOptionsOpen((o) => !o)}
          aria-expanded={optionsOpen}
          aria-controls="options-body"
          className="w-full flex items-center justify-between gap-3 border-t px-5 sm:px-6 py-3.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>{optionsOpen ? "옵션 접기" : "옵션 자세히"}</span>
          <ChevronDown
            className={
              "size-4 transition-transform duration-200 " +
              (optionsOpen ? "rotate-180" : "")
            }
          />
        </button>

        {optionsOpen && (
          <div
            id="options-body"
            className="border-t p-5 sm:p-6 animate-in fade-in slide-in-from-top-1 duration-150"
          >
            <PasswordOptionsForm opts={opts} onChange={handleOptsChange} />
          </div>
        )}
      </section>

      <footer className="border-t pt-5 space-y-1.5 text-xs leading-relaxed">
        <div className="flex items-center gap-2 text-foreground/80 font-medium">
          <ShieldCheck className="size-3.5 shrink-0 text-emerald-600 dark:text-emerald-500" />
          100% 브라우저에서 생성됩니다
        </div>
        <div className="text-muted-foreground/80 pl-[1.375rem]">
          서버 전송 없음 · 저장 없음 · 추적 없음
        </div>
        <div className="flex items-start gap-2 text-muted-foreground/90 pt-1">
          <span className="text-amber-600 dark:text-amber-500 shrink-0 leading-tight">
            ⚠️
          </span>
          <span>
            새로고침하면 비밀번호는 모두 사라집니다. 중요한 사이트의 비밀번호는
            별도로 안전하게 관리하세요.
          </span>
        </div>
      </footer>
    </main>
  );
}
