// 세션 비밀번호 히스토리 관리 헬퍼.
//
// 모든 함수는 **순수 함수** 로 새 배열을 반환한다 — React state 업데이트에
// 그대로 사용 가능. 상태 자체는 page.tsx 의 useState 가 보관한다(메모리 only,
// CLAUDE.md §🔒).
//
// 배열은 "최신이 앞" 순서로 유지된다. 즐겨찾기와 일반의 시각 분리는 표시
// 단계(HistoryList)에서 split 으로 처리.

import type { PasswordEntry } from "@/types/options";

/** 한 세션에서 보관하는 최대 항목 수. 초과 시 오래된 비-즐겨찾기부터 자동 삭제. */
export const HISTORY_LIMIT = 20;

interface CreateEntryArgs {
  value: string;
  index: number;
  isEdited?: boolean;
  score?: 0 | 1 | 2 | 3 | 4 | null;
}

/**
 * 새 히스토리 항목 생성. ID 는 `crypto.randomUUID()`.
 * 비밀번호 자체와는 별개 식별자이므로 lib/random.ts 출입구를 거치지 않는다.
 */
export function createEntry({
  value,
  index,
  isEdited = false,
  score = null,
}: CreateEntryArgs): PasswordEntry {
  return {
    id: crypto.randomUUID(),
    index,
    value,
    createdAt: Date.now(),
    length: Array.from(value).length,
    score,
    isFavorite: false,
    isEdited,
  };
}

/**
 * 히스토리 앞쪽에 새 항목을 추가하고 한도(HISTORY_LIMIT)를 적용해 반환.
 */
export function prependEntry(
  entries: readonly PasswordEntry[],
  entry: PasswordEntry,
): PasswordEntry[] {
  return pruneToLimit([entry, ...entries]);
}

/**
 * HISTORY_LIMIT 초과 시 가장 오래된 비-즐겨찾기부터 잘라낸다.
 * 즐겨찾기는 한도 계산과 무관하게 항상 유지(사용자가 직접 ⭐ 해제하지
 * 않는 한 사라지지 않음).
 */
export function pruneToLimit(
  entries: readonly PasswordEntry[],
): PasswordEntry[] {
  if (entries.length <= HISTORY_LIMIT) return [...entries];

  const favorites = entries.filter((e) => e.isFavorite);
  const others = entries.filter((e) => !e.isFavorite);
  const room = HISTORY_LIMIT - favorites.length;

  // 즐겨찾기만으로도 한도 초과인 극단적 케이스 — 즐겨찾기는 안 자른다는
  // 원칙상 그대로 둠(사용자가 직접 정리).
  if (room <= 0) return [...favorites, ...others.slice(0, 0)];

  // others 는 최신이 앞 순서 → 앞에서부터 room 개 유지.
  const keepOtherIds = new Set(others.slice(0, room).map((e) => e.id));
  return entries.filter((e) => e.isFavorite || keepOtherIds.has(e.id));
}

export function toggleFavorite(
  entries: readonly PasswordEntry[],
  id: string,
): PasswordEntry[] {
  return entries.map((e) =>
    e.id === id ? { ...e, isFavorite: !e.isFavorite } : e,
  );
}

export function removeEntry(
  entries: readonly PasswordEntry[],
  id: string,
): PasswordEntry[] {
  return entries.filter((e) => e.id !== id);
}

/** 비-즐겨찾기 일괄 삭제. "모두 지우기" 버튼에서 사용. */
export function clearNonFavorite(
  entries: readonly PasswordEntry[],
): PasswordEntry[] {
  return entries.filter((e) => e.isFavorite);
}

/**
 * 강도 측정 비동기 완료 후 해당 항목의 score 를 채워 넣는다.
 * 항목이 이미 삭제됐을 가능성 대비 — 없으면 그대로 반환.
 */
export function updateScore(
  entries: readonly PasswordEntry[],
  id: string,
  score: 0 | 1 | 2 | 3 | 4,
): PasswordEntry[] {
  let changed = false;
  const next = entries.map((e) => {
    if (e.id === id && e.score !== score) {
      changed = true;
      return { ...e, score };
    }
    return e;
  });
  return changed ? next : [...entries];
}
