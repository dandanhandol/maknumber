// zxcvbn 기반 비밀번호 강도 측정 래퍼.
//
// zxcvbn 라이브러리는 사전 데이터로 번들이 크다(약 800KB+ minified).
// 페이지 첫 로드를 빠르게 하기 위해 **동적 import**로 첫 호출 시점에만
// 사전을 로딩한다(이후 모듈 캐시).

import type { Strength } from "@/types/options";

type ZxcvbnFn = typeof import("zxcvbn");

let loader: Promise<ZxcvbnFn> | null = null;

function loadZxcvbn(): Promise<ZxcvbnFn> {
  if (!loader) {
    loader = import("zxcvbn").then((m) => m.default ?? (m as unknown as ZxcvbnFn));
  }
  return loader;
}

const SCORE_LABELS: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "매우 약함",
  1: "약함",
  2: "보통",
  3: "강함",
  4: "매우 강함",
};

/** 초 단위 추정값을 한국어 표현으로 변환. zxcvbn 타입은 매우 큰 수를 문자열로
 *  반환할 수 있어 `string | number` 모두 받는다. */
function formatDurationKorean(value: number | string): string {
  const seconds = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(seconds)) return "사실상 무한";
  if (seconds < 1) return "즉시";
  const MIN = 60;
  const HOUR = MIN * 60;
  const DAY = HOUR * 24;
  const MONTH = DAY * 30;
  const YEAR = DAY * 365;

  if (seconds < MIN) return `${Math.round(seconds)}초`;
  if (seconds < HOUR) return `${Math.round(seconds / MIN)}분`;
  if (seconds < DAY) return `${Math.round(seconds / HOUR)}시간`;
  if (seconds < MONTH) return `${Math.round(seconds / DAY)}일`;
  if (seconds < YEAR) return `${Math.round(seconds / MONTH)}개월`;
  if (seconds < YEAR * 100) return `${Math.round(seconds / YEAR)}년`;
  if (seconds < YEAR * 1_000_000) {
    return `${Math.round(seconds / YEAR / 100)}세기`;
  }
  return "사실상 무한";
}

/**
 * 비밀번호 강도를 비동기로 측정한다. 첫 호출 시에 zxcvbn 사전을 로딩한다.
 * 결과는 영구 저장하지 말고 컴포넌트 state에만 보관할 것(CLAUDE.md §🔒).
 */
export async function measureStrength(password: string): Promise<Strength> {
  if (password.length === 0) {
    return { score: 0, label: SCORE_LABELS[0], crackTimeDisplay: "—" };
  }
  const zxcvbn = await loadZxcvbn();
  const r = zxcvbn(password);
  const score = Math.min(4, Math.max(0, r.score)) as 0 | 1 | 2 | 3 | 4;
  return {
    score,
    label: SCORE_LABELS[score],
    crackTimeDisplay: formatDurationKorean(
      r.crack_times_seconds.offline_slow_hashing_1e4_per_second,
    ),
  };
}
