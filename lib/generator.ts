// 비밀번호 생성기. 옵션을 받아 조건을 모두 만족하는 비밀번호를 반환한다.
//
// 핵심 동작 (SPEC.md §2 참조):
// - 선택된 각 카테고리(대/소/숫자/특수)에서 **최소 1자 보장**.
// - 나머지는 결합 풀에서 추출 후 전체 셔플로 위치 편향 제거.
// - 모든 난수는 lib/random.ts 단일 출입구를 통해서만 호출 (Math.random 금지).
// - 길이/카테고리/symbolMode 등 잘못된 입력은 normalizeOptions가 합법 상태로
//   보정한 뒤 생성한다.

import {
  MAX_LENGTH,
  MIN_LENGTH,
  type PasswordOptions,
  type SymbolMode,
} from "@/types/options";
import { pick, shuffle } from "./random";

// 문자 풀 상수. 도메인 로직과 결합도가 높아 generator 옆에 둔다.
const UPPERCASE_POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE_POOL = "abcdefghijklmnopqrstuvwxyz";
const DIGIT_POOL = "0123456789";

// SPEC.md §2.3 — 특수문자 모드별 풀. UI 미리보기에서도 동일한 출처를
// 쓰도록 export.
//
// "safe" 8자는 다음 두 기준을 모두 만족한다:
//   1. 호환성: 대부분의 일반 웹사이트가 비밀번호로 허용
//   2. 보안: 사이트 측 입력 검증/이스케이프 실수로 인한 위험이 낮음
//      (SQL injection, XSS, command injection 등의 공격 벡터로 흔히
//       쓰이는 `.` `'` `"` `;` `<` `>` `\` `/` `` ` `` `|` 등은 제외)
export const SYMBOL_POOLS: Record<Exclude<SymbolMode, "off">, string> = {
  full: "!@#$%^&*()_+-=[]{}|;:,.<>?/~`'\"\\",
  safe: "!@#$%^&*",
};

// SPEC.md §2.4 — 혼동되는 문자(육안 헷갈리기 쉬움). 특수문자 풀은 영향 없음.
const CONFUSABLE_CHARS = new Set("OoIl01");

function filterConfusable(pool: string): string {
  let result = "";
  for (const c of pool) {
    if (!CONFUSABLE_CHARS.has(c)) result += c;
  }
  return result;
}

/**
 * 옵션을 합법 상태로 정규화한다.
 * - 길이를 [MIN_LENGTH, MAX_LENGTH] 범위로 클램프.
 * - 길이가 활성 카테고리 수보다 작으면 카테고리 수에 맞춰 자동 증가.
 * - symbolMode === "off"면 symbols 토글을 강제로 false 처리.
 * - 카테고리가 전부 꺼져 있으면 lowercase로 폴백 (UI에서 막아야 하지만 안전망).
 *
 * UI는 원본 옵션과 정규화 결과를 비교해 사용자에게 "보정됨"을 안내할 수 있다.
 */
export function normalizeOptions(opts: PasswordOptions): PasswordOptions {
  const { uppercase, digits, symbolMode, excludeConfusable } = opts;
  let { length, lowercase, symbols } = opts;

  if (symbolMode === "off") {
    symbols = false;
  }

  if (!uppercase && !lowercase && !digits && !symbols) {
    lowercase = true;
  }

  length = Math.floor(length);
  if (!Number.isFinite(length) || length < MIN_LENGTH) length = MIN_LENGTH;
  if (length > MAX_LENGTH) length = MAX_LENGTH;

  const categoryCount =
    (uppercase ? 1 : 0) +
    (lowercase ? 1 : 0) +
    (digits ? 1 : 0) +
    (symbols ? 1 : 0);
  if (length < categoryCount) length = categoryCount;

  return {
    length,
    uppercase,
    lowercase,
    digits,
    symbols,
    symbolMode,
    excludeConfusable,
  };
}

/** 활성 카테고리별 문자 풀(코드포인트 배열). 혼동 제외 옵션 반영. */
function buildPools(opts: PasswordOptions): string[][] {
  const filter = opts.excludeConfusable
    ? filterConfusable
    : (p: string) => p;

  const pools: string[][] = [];
  if (opts.uppercase) pools.push(Array.from(filter(UPPERCASE_POOL)));
  if (opts.lowercase) pools.push(Array.from(filter(LOWERCASE_POOL)));
  if (opts.digits) pools.push(Array.from(filter(DIGIT_POOL)));
  if (opts.symbols && opts.symbolMode !== "off") {
    // 특수문자 풀에는 혼동 문자가 없어 필터 불필요.
    pools.push(Array.from(SYMBOL_POOLS[opts.symbolMode]));
  }

  if (pools.length === 0) {
    throw new Error("generator: 선택된 카테고리가 없습니다.");
  }
  if (pools.some((p) => p.length === 0)) {
    // 정상 경로에서는 발생하지 않지만, 미래에 풀이 줄어들 가능성 대비.
    throw new Error("generator: 모든 문자가 제외된 풀이 있습니다.");
  }

  return pools;
}

/**
 * 옵션을 받아 비밀번호 한 개를 생성한다. 순수 함수 — 같은 시점의 RNG 상태
 * 외의 부수효과 없음. 호출자는 결과를 React state에만 보관해야 한다(영구
 * 저장 금지, CLAUDE.md §🔒 참조).
 */
export function generate(opts: PasswordOptions): string {
  const normalized = normalizeOptions(opts);
  const pools = buildPools(normalized);
  const combinedPool = pools.flat();

  const chars: string[] = [];

  // 1단계: 각 카테고리에서 1자씩 (최소 1자 보장)
  for (const pool of pools) {
    chars.push(pick(pool));
  }

  // 2단계: 남은 자리는 결합 풀에서 균등 추출
  const remaining = normalized.length - chars.length;
  for (let i = 0; i < remaining; i++) {
    chars.push(pick(combinedPool));
  }

  // 3단계: 위치 편향 제거를 위해 전체 셔플
  shuffle(chars);

  // 4단계: 첫 글자는 영문자(대/소)로 보장 (SPEC.md §2.6).
  // 영문자 카테고리가 모두 꺼져 있으면 규칙 미적용(사용자가 의도적으로
  // 숫자/특수문자만 비밀번호를 만들려는 경우).
  if (normalized.uppercase || normalized.lowercase) {
    if (!isAsciiLetter(chars[0])) {
      const idx = chars.findIndex(isAsciiLetter);
      if (idx > 0) {
        [chars[0], chars[idx]] = [chars[idx], chars[0]];
      }
    }
  }

  return chars.join("");
}

function isAsciiLetter(c: string): boolean {
  if (c.length !== 1) return false;
  const code = c.charCodeAt(0);
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}
