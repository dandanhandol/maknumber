"use client";

// 막번호 메인 페이지. 모든 상태는 메모리(React state)에만 둔다.
// 영구 저장소 사용 금지(CLAUDE.md §🔒).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Lock, ShieldCheck } from "lucide-react";
import type { PasswordEntry, PasswordOptions, Strength } from "@/types/options";
import { MIN_LENGTH } from "@/types/options";
import { DEFAULT_PRESET_ID, getPreset } from "@/lib/presets";
import { generate, normalizeOptions } from "@/lib/generator";
import {
  getDangerMatches,
  getStrength,
} from "@/lib/evaluator";
import {
  clearNonFavorite,
  createEntry,
  prependEntry,
  removeEntry,
  toggleFavorite,
  updateScore,
} from "@/lib/history";
import { PresetSelector } from "@/components/PresetSelector";
import { PasswordOptionsForm } from "@/components/PasswordOptions";
import { PasswordOutput } from "@/components/PasswordOutput";
import { StrengthMeter } from "@/components/StrengthMeter";
import { DangerWarning } from "@/components/DangerWarning";
import { HistoryList } from "@/components/HistoryList";
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

  // 편집 모드 — Stage 2 (2026-05-20).
  // draft 는 편집 중 문자열, originalBeforeEdit 은 "되돌리기" 용.
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>("");

  // 세션 히스토리 — Stage 3 (2026-05-20). 메모리 only, 최대 20개.
  const [history, setHistory] = useState<PasswordEntry[]>([]);
  // 현재 메인 비번이 history 의 어느 항목인지 추적(카드 강조용).
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  // 표시용 # 번호. 삭제해도 줄어들지 않는 단조 증가 카운터.
  const indexRef = useRef(0);
  // 다음 history 추가가 "편집됨" 항목인지 표시 (handleEditCommit 직후 set).
  const nextEditedRef = useRef(false);
  // 카드 클릭으로 메인을 swap 한 직후엔 history 자동 추가를 건너뛴다.
  const skipNextHistoryRef = useRef(false);

  // 평가 대상: 편집 중에는 draft, 아니면 pwd. 편집/되돌리기 사이의 자연스러운
  // 전환을 위해 단일 변수로 통일.
  const evalTarget = editing ? draft : pwd;

  // 위험 패턴 디바운스(200ms) — 편집 중 매 키스트로크마다 배너가 깜빡이는
  // 것을 막는다. dangerPatterns 자체는 가벼우나 UI 안정성 우선.
  const [debouncedDangerTarget, setDebouncedDangerTarget] = useState<string>(
    "",
  );
  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedDangerTarget(evalTarget);
    }, 200);
    return () => clearTimeout(handle);
  }, [evalTarget]);
  const danger = useMemo(
    () => getDangerMatches(debouncedDangerTarget),
    [debouncedDangerTarget],
  );

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

  // 강도는 비동기(zxcvbn 동적 import). 입력 빠른 변경 시 150ms 디바운스
  // (SPEC: 편집 중 실시간 평가). setState 는 setTimeout 콜백 안이라 룰 안전.
  useEffect(() => {
    if (!evalTarget) return;
    const handle = setTimeout(() => {
      getStrength(evalTarget).then(setStrength);
    }, 150);
    return () => clearTimeout(handle);
  }, [evalTarget]);

  // pwd 가 안정된 후(300ms 디바운스) 히스토리에 자동 추가. 슬라이더 드래그
  // 중 매 키프레임마다 추가되어 폭주하는 것을 막는다.
  // 카드 클릭으로 swap 한 직후엔 skipNextHistoryRef 로 건너뜀.
  useEffect(() => {
    if (!pwd) return;
    if (skipNextHistoryRef.current) {
      skipNextHistoryRef.current = false;
      return;
    }
    const handle = setTimeout(() => {
      setHistory((h) => {
        // 가장 최신 항목과 동일하면 중복 추가 방지.
        if (h.length > 0 && h[0].value === pwd) return h;
        const isEdited = nextEditedRef.current;
        nextEditedRef.current = false;
        indexRef.current += 1;
        const entry = createEntry({
          value: pwd,
          index: indexRef.current,
          isEdited,
        });
        // 강도 측정은 entry 추가 직후 비동기로 score 채움.
        getStrength(pwd).then((s) => {
          setHistory((prev) => updateScore(prev, entry.id, s.score));
        });
        setCurrentEntryId(entry.id);
        return prependEntry(h, entry);
      });
    }, 300);
    return () => clearTimeout(handle);
  }, [pwd]);

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

  // ─── 편집 모드 핸들러 ──────────────────────────────────────────
  const handleEditStart = useCallback(() => {
    if (!pwd) return;
    setDraft(pwd);
    setEditing(true);
  }, [pwd]);

  const handleEditChange = useCallback((next: string) => {
    setDraft(next);
  }, []);

  const handleEditCommit = useCallback(() => {
    if (Array.from(draft).length < MIN_LENGTH) return; // 안전망
    // 다음 history 자동 추가 시 isEdited=true 표시.
    nextEditedRef.current = true;
    setPwd(draft);
    setEditing(false);
    // 편집된 비번은 어떤 프리셋과도 매칭되지 않으므로 강조 해제.
    setPresetId(null);
  }, [draft]);

  const handleEditRevert = useCallback(() => {
    setDraft("");
    setEditing(false);
  }, []);

  // DangerWarning 의 "새로 만들기" — 편집 중이라도 사용자가 명시적으로 누르면
  // 편집을 폐기하고 새 비번 생성. 무심코 누르는 사고를 막기 위해 PasswordOutput
  // 의 view 액션은 별도(regenerate) 로 분리되어 있고, 이 함수는 위험 배너
  // 트리거에서만 사용된다.
  const handleDangerRegenerate = useCallback(() => {
    if (editing) {
      setEditing(false);
      setDraft("");
    }
    setPwd(generate(opts));
  }, [editing, opts]);

  // ─── 히스토리 핸들러 ─────────────────────────────────────────────
  const handleHistorySelect = useCallback(
    (id: string) => {
      const entry = history.find((e) => e.id === id);
      if (!entry) return;
      // 편집 중에 카드를 누르면 편집 내용 폐기. 의도 명확하다고 가정.
      if (editing) {
        setEditing(false);
        setDraft("");
      }
      // history 자동 추가 effect 가 다시 트리거되는 것을 방지.
      skipNextHistoryRef.current = true;
      setPwd(entry.value);
      setCurrentEntryId(entry.id);
      // 선택된 비번은 어떤 프리셋과도 매칭이 보장되지 않으므로 강조 해제.
      setPresetId(null);
    },
    [history, editing],
  );

  const handleHistoryToggleFavorite = useCallback((id: string) => {
    setHistory((h) => toggleFavorite(h, id));
  }, []);

  const handleHistoryRemove = useCallback(
    (id: string) => {
      setHistory((h) => removeEntry(h, id));
      if (currentEntryId === id) setCurrentEntryId(null);
    },
    [currentEntryId],
  );

  const handleHistoryClearAll = useCallback(() => {
    const hasNonFav = history.some((e) => !e.isFavorite);
    if (!hasNonFav) return;
    const ok = window.confirm(
      "즐겨찾기를 제외한 모든 비밀번호를 지웁니다. 계속할까요?",
    );
    if (!ok) return;
    setHistory((h) => {
      const next = clearNonFavorite(h);
      // 현재 메인이 비-즐겨찾기로 사라지면 강조 dangling.
      if (currentEntryId && !next.some((e) => e.id === currentEntryId)) {
        setCurrentEntryId(null);
      }
      return next;
    });
  }, [history, currentEntryId]);

  return (
    <main className="container mx-auto max-w-2xl px-4 py-6 sm:py-14 space-y-5 sm:space-y-7">
      <header className="flex items-center gap-2.5 sm:gap-3 pb-1">
        <div className="size-9 sm:size-10 rounded-xl bg-foreground text-background flex items-center justify-center shadow-sm shrink-0">
          <Lock className="size-[18px] sm:size-5" strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-none">
            막번호
          </h1>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">
            막 쓸 비밀번호, 편하게 막 만들어요
          </p>
        </div>
        <ThemeToggle />
      </header>

      <section className="space-y-3">
        <PasswordOutput
          pwd={pwd}
          editing={editing}
          draft={draft}
          onEditStart={handleEditStart}
          onEditChange={handleEditChange}
          onEditCommit={handleEditCommit}
          onEditRevert={handleEditRevert}
          onRegenerate={regenerate}
        />
        <StrengthMeter strength={strength} />
        <DangerWarning
          matches={danger}
          onRegenerate={handleDangerRegenerate}
        />
      </section>

      <HistoryList
        history={history}
        currentEntryId={currentEntryId}
        onSelect={handleHistorySelect}
        onToggleFavorite={handleHistoryToggleFavorite}
        onRemove={handleHistoryRemove}
        onClearAll={handleHistoryClearAll}
      />

      {/* 편집 모드에서는 옵션·프리셋이 비활성화 — fieldset disabled 가 자식
          form 컨트롤(button/input/Switch/Slider) 전체를 자동 비활성화한다.
          사용자 결정(2026-05-20): 편집 중 옵션 변경 → 자동 재생성 → 편집
          손실 문제를 단순화로 해결. */}
      <fieldset
        disabled={editing}
        className="rounded-2xl border bg-card/40 backdrop-blur-sm m-0 p-0 transition-opacity disabled:opacity-50"
      >
        {/* 프리셋 칩 — 옵션 카드 안 맨 위 줄(2026-05-19: Stage 1.3). */}
        <div className="p-5 sm:p-6">
          <PresetSelector presetId={presetId} onSelect={handlePreset} />
        </div>

        {/* 옵션 본문 토글. 기본은 펼침 — Stage 1.3/1.4 결정. */}
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
      </fieldset>

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
