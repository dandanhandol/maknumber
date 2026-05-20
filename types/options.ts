// 막번호 도메인의 핵심 타입 정의.
// 옵션, 프리셋, 강도 등 UI/도메인 양쪽에서 공유되는 모델.

/** 비밀번호 길이의 허용 범위. SPEC.md §2.1 참조. */
export const MIN_LENGTH = 4;
export const MAX_LENGTH = 64;

/**
 * 특수문자 모드.
 * - `full`: 거의 모든 일반 특수문자
 * - `safe`: 대부분의 사이트가 허용하는 보수적 4종 (`!@#$`)
 * - `off`: 특수문자 사용 안 함 (symbols 토글이 해제된 것과 동치)
 */
export type SymbolMode = "full" | "safe" | "off";

/** 사용자가 입력하는 비밀번호 생성 옵션 전체. */
export interface PasswordOptions {
  /** 4 ~ 64 사이의 정수. */
  length: number;
  /** 대문자(A-Z) 포함 */
  uppercase: boolean;
  /** 소문자(a-z) 포함 */
  lowercase: boolean;
  /** 숫자(0-9) 포함 */
  digits: boolean;
  /** 특수문자 포함 (구체적 풀은 symbolMode로 결정) */
  symbols: boolean;
  /** 특수문자 풀 모드 */
  symbolMode: SymbolMode;
  /** 혼동되는 문자(O/0, l/1, I 등) 제외 */
  excludeConfusable: boolean;
}

/**
 * 사이트별 프리셋. 사용자가 클릭하면 옵션 전체가 이 값으로 교체된다.
 * 정의 위치는 lib/presets.ts. SPEC.md §4 참조.
 */
export interface Preset {
  /** 안정적인 식별자 (예: "general", "naver"). 라우팅/저장 키에는 안 쓰임. */
  id: string;
  /** UI 표시 라벨 (한국어) */
  label: string;
  /** 한 줄 설명 */
  description: string;
  /** 이 프리셋이 적용하는 옵션 값 */
  options: PasswordOptions;
}

/**
 * zxcvbn 기반 강도 측정 결과의 도메인 표현.
 * lib/strength.ts 에서 zxcvbn 결과를 이 형태로 정규화한다.
 */
export interface Strength {
  /** zxcvbn 0~4 점수 */
  score: 0 | 1 | 2 | 3 | 4;
  /** 한국어 라벨 (예: "매우 약함", "보통", "매우 강함") */
  label: string;
  /** 사람이 읽는 크랙 시간 (예: "3시간", "300년") */
  crackTimeDisplay: string;
}

/**
 * 세션 비밀번호 히스토리 항목 (Stage 3, 2026-05-20).
 *
 * 메모리(React state)에만 보관한다. localStorage/sessionStorage/IndexedDB/
 * cookie 등 영구 저장소 사용 금지 — 새로고침/탭 닫기 = 모두 소거.
 * CLAUDE.md §🔒 보안 원칙 일관.
 */
export interface PasswordEntry {
  /** 고유 식별자. `crypto.randomUUID()` 기반. */
  id: string;
  /** 표시용 #번호. 세션 동안 단조 증가하며 삭제해도 줄어들지 않음. */
  index: number;
  /** 비밀번호 자체 — 카드에 전체 표시 (사용자 결정 2026-05-20). */
  value: string;
  /** 생성 시각 (Date.now). 정렬·표시용. */
  createdAt: number;
  /** 길이 (코드포인트 단위). */
  length: number;
  /** zxcvbn 점수. 측정이 비동기라 완료 전엔 null. */
  score: 0 | 1 | 2 | 3 | 4 | null;
  /** 즐겨찾기 — 좌측 고정, 20개 한도 자동 삭제 면제. */
  isFavorite: boolean;
  /** 직접 편집으로 생성된 항목 (✏️ 라벨 표시용). */
  isEdited: boolean;
}
