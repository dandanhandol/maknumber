// 사이트별 프리셋 정의. 사용자가 프리셋을 클릭하면 옵션 전체가 이 값으로
// 교체된다. SPEC.md §4.1 표 참조.
//
// 주의: 각 사이트의 실제 비밀번호 정책은 자주 바뀐다. 여기 적힌 값은
// "흔한 정책에 대체로 맞는" 보수적 기본값일 뿐이며, 실패 시 사용자가
// 옵션을 직접 미세 조정한다.

import type { Preset } from "@/types/options";

export const PRESETS: readonly Preset[] = [
  {
    id: "general",
    label: "일반",
    description: "대부분의 사이트와 호환되는 기본값",
    options: {
      length: 12,
      uppercase: true,
      lowercase: true,
      digits: true,
      symbols: true,
      symbolMode: "safe",
      excludeConfusable: true,
    },
  },
  {
    id: "strong",
    label: "강화",
    description: "긴 길이 + 풍부한 특수문자",
    options: {
      length: 20,
      uppercase: true,
      lowercase: true,
      digits: true,
      symbols: true,
      symbolMode: "full",
      excludeConfusable: true,
    },
  },
  {
    id: "naver",
    label: "네이버",
    description: "8~16자, 영·숫·특 3종 이상",
    options: {
      length: 10,
      uppercase: true,
      lowercase: true,
      digits: true,
      symbols: true,
      symbolMode: "safe",
      excludeConfusable: true,
    },
  },
  {
    id: "google",
    label: "구글",
    description: "8자 이상 권장, 여유 길이",
    options: {
      length: 14,
      uppercase: true,
      lowercase: true,
      digits: true,
      symbols: true,
      symbolMode: "full",
      excludeConfusable: true,
    },
  },
  {
    id: "bank",
    label: "은행권",
    description: "10자 + 영·숫·특 3종 조합 의무",
    options: {
      length: 10,
      uppercase: true,
      lowercase: true,
      digits: true,
      symbols: true,
      symbolMode: "safe",
      excludeConfusable: true,
    },
  },
  {
    id: "game",
    label: "게임",
    description: "특수문자 미허용 사이트 다수",
    options: {
      length: 12,
      uppercase: true,
      lowercase: true,
      digits: true,
      symbols: false,
      symbolMode: "off",
      excludeConfusable: true,
    },
  },
];

/** 기본 진입 프리셋 ID. SPEC.md §1.3 — "일반" 프리셋으로 시작. */
export const DEFAULT_PRESET_ID = "general";

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
