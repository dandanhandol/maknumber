// 임의 문자열의 비밀번호 평가 인프라.
//
// 강도(zxcvbn) · 위험 패턴 · 문자 구성 통계를 한 모듈에서 노출한다.
// generator 와 의존성 없음 — 사용자가 직접 편집한 문자열이나 향후 다른
// 생성 모드(예: "찐번호" 한영 매핑)에서도 동일 인프라 재사용 가능.
//
// 호출 패턴 (UI 디바운스 권장값):
//   - getComposition(pwd)   동기, O(n)        → 즉시
//   - getDangerMatches(pwd) 동기, 사전 크기   → 200ms 디바운스
//   - getStrength(pwd)      비동기, zxcvbn   → 150ms 디바운스

import { findDangerPatterns, type DangerMatch } from "./dangerPatterns";
import { measureStrength } from "./strength";
import type { Strength } from "@/types/options";

// 외부에서도 같은 타입을 import 할 수 있도록 re-export.
export type { DangerMatch };

/** 비밀번호 문자 구성 분해. */
export interface Composition {
  /** 대문자 (A-Z) */
  upper: number;
  /** 소문자 (a-z) */
  lower: number;
  /** 숫자 (0-9) */
  digit: number;
  /** ASCII 특수문자 (영숫이 아닌 0x20–0x7E) */
  symbol: number;
  /** ASCII 범위 밖 (한글, 이모지 등). 사용자 편집 시에만 등장 가능. */
  other: number;
}

/**
 * 문자 구성 통계. 동기, O(n).
 * 편집 중 매 키스트로크마다 호출되어도 안전한 가벼운 분류 함수.
 *
 * 코드포인트 단위로 순회(`for...of`)하여 BMP 밖 문자(이모지 등)도 정확히 1로
 * 카운트한다. 한글은 ASCII 범위 밖이라 `other` 로 집계.
 */
export function getComposition(pwd: string): Composition {
  const c: Composition = {
    upper: 0,
    lower: 0,
    digit: 0,
    symbol: 0,
    other: 0,
  };

  for (const ch of pwd) {
    // 보조 평면(BMP 밖, JS 문자열에선 surrogate pair) → 길이 2.
    if (ch.length > 1) {
      c.other++;
      continue;
    }
    const code = ch.charCodeAt(0);
    if (code >= 0x41 && code <= 0x5a) c.upper++;
    else if (code >= 0x61 && code <= 0x7a) c.lower++;
    else if (code >= 0x30 && code <= 0x39) c.digit++;
    else if (code >= 0x20 && code <= 0x7e) c.symbol++;
    else c.other++; // 제어문자 / 한글 / 그 외 비ASCII
  }

  return c;
}

/**
 * 위험 패턴 매칭. `dangerPatterns` 모듈에 위임.
 * 카테고리당 첫 매치만, 위험도 내림차순 정렬된 배열을 반환.
 */
export function getDangerMatches(pwd: string): DangerMatch[] {
  return findDangerPatterns(pwd);
}

/**
 * 강도 측정. `strength` 모듈에 위임.
 * zxcvbn 사전을 동적 import 로 한 번만 로딩(첫 호출 시 약 800KB 청크).
 */
export async function getStrength(pwd: string): Promise<Strength> {
  return measureStrength(pwd);
}
