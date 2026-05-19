"use client";

// 사이트별 프리셋 선택. shadcn Tabs 대신 라벨 + 작은 pill 칩으로 표시해
// 페이지 네비처럼 보이지 않게 한다. 사용자가 옵션을 직접 수정해 "사용자
// 지정" 상태가 되면 presetId=null로 전달되어 어떤 칩도 강조되지 않는다.

import { PRESETS } from "@/lib/presets";

interface Props {
  presetId: string | null;
  onSelect: (id: string) => void;
}

export function PresetSelector({ presetId, onSelect }: Props) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-xs font-medium text-muted-foreground shrink-0 uppercase tracking-wider">
        프리셋
      </span>
      <div className="flex gap-1.5 flex-wrap">
        {PRESETS.map((p) => {
          const active = p.id === presetId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              title={p.description}
              aria-pressed={active}
              className={
                "inline-flex items-center rounded-full px-3 py-1 text-xs transition-colors border " +
                (active
                  ? "bg-foreground text-background border-foreground shadow-sm"
                  : "bg-background border-border text-foreground/70 hover:text-foreground hover:bg-muted")
              }
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
