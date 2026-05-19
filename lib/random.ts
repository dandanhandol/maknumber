// 안전한 난수의 **단일 출입구**.
//
// 보안 원칙 (CLAUDE.md §🔒):
// - 모든 난수 호출은 이 모듈을 거친다. 다른 곳에서 직접 crypto.getRandomValues
//   를 호출하지 않는다.
// - Math.random()은 **절대** 사용하지 않는다. 예측 가능하고 암호학적으로
//   안전하지 않다.
// - 모듈로 편향(modulo bias)을 피하기 위해 rejection sampling을 사용한다.

/**
 * [0, maxExclusive) 범위의 균등 분포 정수를 반환한다.
 *
 * 32-bit unsigned 난수를 뽑은 뒤 `2^32 / maxExclusive`의 정수 배수 영역 안에
 * 들어온 값만 채택해 `% maxExclusive`로 환산한다. 영역 바깥의 값은 버리고
 * 다시 뽑는다(rejection sampling). 이렇게 하면 모듈로 편향이 0이 된다.
 */
export function randomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error("randomInt: maxExclusive는 양의 정수여야 합니다.");
  }
  if (maxExclusive === 1) return 0;

  const range = 0x1_0000_0000; // 2^32
  const maxAcceptable = range - (range % maxExclusive);
  const buf = new Uint32Array(1);

  // 평균적으로 한두 번 안에 채택된다. 무한 루프 방지용 상한을 두지 않는 이유는
  // maxExclusive ≤ 2^32 조건에서 reject 확률이 항상 1/2 미만이기 때문.
  while (true) {
    crypto.getRandomValues(buf);
    const v = buf[0];
    if (v < maxAcceptable) {
      return v % maxExclusive;
    }
  }
}

/** 배열에서 균등 확률로 원소 1개를 뽑는다. */
export function pick<T>(items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error("pick: 빈 배열에서는 선택할 수 없습니다.");
  }
  return items[randomInt(items.length)];
}

/**
 * Fisher-Yates 셔플로 배열을 in-place로 섞고 동일 참조를 반환한다.
 * 호출자가 원본을 보존하려면 미리 복사해서 넘긴다.
 */
export function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}
