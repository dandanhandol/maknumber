"use client";

// 옵션 입력 폼. 길이, 카테고리 4종, 특수문자 모드(2종), 혼동 제외.
// SPEC.md §2 참조. 정규화(normalizeOptions)는 부모(page)가 책임진다.

import type { PasswordOptions, SymbolMode } from "@/types/options";
import { MAX_LENGTH, MIN_LENGTH } from "@/types/options";
import { SYMBOL_POOLS } from "@/lib/generator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  opts: PasswordOptions;
  onChange: (next: PasswordOptions) => void;
}

// "제외"는 별도 버튼 대신 특수문자 토글로 표현(SPEC §2.3).
const SYMBOL_MODES: { value: Exclude<SymbolMode, "off">; label: string }[] = [
  { value: "safe", label: "일부" },
  { value: "full", label: "전체" },
];

// 풀의 모든 문자를 공백으로 구분해 표시(사용자 피드백 2026-05-19).
// 각 특수문자가 명확히 식별되도록 모노스페이스로 출력하며, 풀이 길면
// break-all 로 자연스럽게 줄바꿈된다.
function previewSpaced(mode: Exclude<SymbolMode, "off">): string {
  return Array.from(SYMBOL_POOLS[mode]).join(" ");
}

export function PasswordOptionsForm({ opts, onChange }: Props) {
  const update = (patch: Partial<PasswordOptions>) =>
    onChange({ ...opts, ...patch });

  const symbolsActive = opts.symbols && opts.symbolMode !== "off";
  const previewMode: Exclude<SymbolMode, "off"> =
    opts.symbolMode === "off" ? "safe" : opts.symbolMode;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">길이</span>
          <Input
            type="number"
            value={opts.length}
            onChange={(e) =>
              update({ length: Number(e.target.value) || MIN_LENGTH })
            }
            min={MIN_LENGTH}
            max={MAX_LENGTH}
            className="w-20 h-8 text-right tabular-nums"
          />
        </div>
        <Slider
          value={[opts.length]}
          onValueChange={(value) => {
            // base-ui Slider는 단일/배열 모두 지원 — 단일 모드 사용.
            const v = Array.isArray(value) ? value[0] : value;
            update({ length: v });
          }}
          min={MIN_LENGTH}
          max={MAX_LENGTH}
          step={1}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ToggleRow
          checked={opts.uppercase}
          onCheck={(v) => update({ uppercase: v })}
          label="대문자 (A-Z)"
        />
        <ToggleRow
          checked={opts.lowercase}
          onCheck={(v) => update({ lowercase: v })}
          label="소문자 (a-z)"
        />
        <ToggleRow
          checked={opts.digits}
          onCheck={(v) => update({ digits: v })}
          label="숫자 (0-9)"
        />
        <ToggleRow
          checked={symbolsActive}
          onCheck={(v) =>
            update({
              symbols: v,
              symbolMode: v
                ? opts.symbolMode === "off"
                  ? "safe"
                  : opts.symbolMode
                : opts.symbolMode,
            })
          }
          label="특수문자"
        />
      </div>

      <div>
        <div
          className={`text-sm font-medium mb-2 ${
            symbolsActive ? "" : "text-muted-foreground"
          }`}
        >
          특수문자 모드
        </div>
        <div className="flex gap-2 mb-2.5">
          {SYMBOL_MODES.map((m) => (
            <Button
              key={m.value}
              type="button"
              variant={
                symbolsActive && opts.symbolMode === m.value
                  ? "default"
                  : "outline"
              }
              onClick={() =>
                update({ symbolMode: m.value, symbols: true })
              }
              disabled={!symbolsActive}
              size="sm"
              className="flex-1"
            >
              {m.label}
            </Button>
          ))}
        </div>
        <code
          className={`block font-mono text-xs leading-relaxed break-all rounded-md bg-muted/50 px-2.5 py-1.5 ${
            symbolsActive ? "text-foreground/80" : "text-muted-foreground/50"
          }`}
          aria-label={`현재 특수문자 풀: ${previewSpaced(previewMode)}`}
        >
          {previewSpaced(previewMode)}
        </code>
      </div>

      <ToggleRow
        checked={opts.excludeConfusable}
        onCheck={(v) => update({ excludeConfusable: v })}
        label={
          <span className="text-sm">
            혼동되는 문자 제외{" "}
            <span className="font-mono text-xs text-muted-foreground">
              (O, 0, l, 1, I)
            </span>
          </span>
        }
      />
    </div>
  );
}

function ToggleRow({
  checked,
  onCheck,
  label,
}: {
  checked: boolean;
  onCheck: (v: boolean) => void;
  label: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <Switch checked={checked} onCheckedChange={onCheck} />
      {typeof label === "string" ? (
        <span className="text-sm">{label}</span>
      ) : (
        label
      )}
    </label>
  );
}
