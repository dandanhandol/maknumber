// 위험 패턴 검사. 생성된(혹은 사용자가 입력한) 비밀번호에 키보드 시퀀스,
// 흔한 어휘, 숫자 시퀀스, 반복 문자, 연도 같은 약한 패턴이 들어있는지
// 매칭한다.
//
// SPEC.md §3 참조.
// 매칭 규칙:
// - 부분 문자열 매칭, case-insensitive 기본.
// - leet 정규화 후에도 매칭: 0→o, 1→i/l, 3→e, 4→a, 5→s, 7→t, @→a, $→s.
// - 사전 패턴은 긴 것부터 매칭(더 정보적인 패턴 우선).
// - 카테고리당 첫 매치 1개만 보고. UI는 위험도 내림차순 결과의 상위
//   1~2개만 표시(SPEC §3.2).

/** 위험 패턴 카테고리. */
export type DangerCategory =
  | "keyboard"
  | "vocab"
  | "numeric"
  | "repeat"
  | "date";

/** 매칭된 위험 패턴 한 건. */
export interface DangerMatch {
  category: DangerCategory;
  /** 사전에 등재된 패턴(어휘/키보드) 혹은 실제로 잡힌 부분 문자열. */
  pattern: string;
}

// A. 키보드 시퀀스. 긴 패턴부터 잡히도록 길이 내림차순 정렬.
const KEYBOARD_PATTERNS: readonly string[] = [
  "1qaz2wsx",
  "1q2w3e",
  "asdfgh",
  "zxcvbn",
  "qwerty",
  "qwertz",
  "azerty",
  "qwer",
  "asdf",
  "zxcv",
  "qaz",
  "wsx",
  "edc",
].sort((a, b) => b.length - a.length);

// C. 흔한 어휘. leet 변형(`passw0rd`, `p@ssword` 등)은 정규화로 매칭되므로
// 사전에는 정상형만 둔다. 한글 패턴은 정규화 영향 없이 원본에서 직접 매칭.
const VOCAB_PATTERNS: readonly string[] = [
  "administrator",
  "iloveyou",
  "princess",
  "superman",
  "password",
  "letmein",
  "welcome",
  "passwd",
  "monkey",
  "dragon",
  "master",
  "batman",
  "admin",
  "login",
  "guest",
  "root",
  "user",
  "test",
  "pass",
  "비밀번호",
  "사랑해",
  "안녕",
].sort((a, b) => b.length - a.length);

// D. 4자리 연도. 단독 토큰이 아니더라도 비밀번호 안에 들어있으면 휴리스틱으로
// 매칭(SPEC.md §3.1 D — false positive 허용).
const YEAR_REGEX = /(19\d{2}|20\d{2})/;

// 카테고리 위험도. 높을수록 더 위험 → UI 상단에 노출.
const SEVERITY: Record<DangerCategory, number> = {
  keyboard: 5,
  vocab: 4,
  numeric: 3,
  repeat: 2,
  date: 1,
};

/** 1을 제외한 모든 leet 매핑을 적용한 lowercase 문자열을 만든다. */
function leetBase(s: string): string {
  return s
    .toLowerCase()
    .replace(/0/g, "o")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/@/g, "a")
    .replace(/\$/g, "s");
}

/**
 * 사전 매칭에 사용할 타깃 문자열들. `1`은 `i` 와 `l` 둘 다 매핑 가능하므로
 * 변형을 모두 생성한다(SPEC §3.2). 한글 패턴은 원본 password에 직접 비교.
 */
function matchTargets(password: string): string[] {
  const lower = password.toLowerCase();
  const leet = leetBase(password);
  return [lower, leet.replace(/1/g, "i"), leet.replace(/1/g, "l")];
}

function findInDict(
  password: string,
  dict: readonly string[],
): string | null {
  const targets = matchTargets(password);
  for (const pat of dict) {
    if (password.includes(pat)) return pat; // 한글 등 변환 무관 매칭
    for (const t of targets) {
      if (t.includes(pat)) return pat;
    }
  }
  return null;
}

/** B. 연속 4자리 이상의 정/역방향 숫자 시퀀스. 같은 숫자 반복은 E가 담당. */
function findNumericSequence(s: string): string | null {
  for (let i = 0; i <= s.length - 4; i++) {
    if (!/^\d/.test(s[i])) continue;
    const dir = s.charCodeAt(i + 1) - s.charCodeAt(i);
    if ((dir !== 1 && dir !== -1) || !/\d/.test(s[i + 1])) continue;

    let end = i + 1;
    while (
      end < s.length &&
      /\d/.test(s[end]) &&
      s.charCodeAt(end) === s.charCodeAt(end - 1) + dir
    ) {
      end++;
    }
    if (end - i >= 4) return s.slice(i, end);
  }
  return null;
}

/** E. 같은 문자가 4회 이상 연속. */
function findRepeat(s: string): string | null {
  const m = s.match(/(.)\1{3,}/);
  return m ? m[0] : null;
}

/** D. 19xx/20xx 연도. */
function findYear(s: string): string | null {
  const m = YEAR_REGEX.exec(s);
  return m ? m[0] : null;
}

/**
 * 비밀번호의 위험 패턴을 모두 찾아 위험도 내림차순으로 반환.
 * 카테고리당 첫 매치 1개만 보고한다.
 */
export function findDangerPatterns(password: string): DangerMatch[] {
  const found: DangerMatch[] = [];

  const kb = findInDict(password, KEYBOARD_PATTERNS);
  if (kb) found.push({ category: "keyboard", pattern: kb });

  const vc = findInDict(password, VOCAB_PATTERNS);
  if (vc) found.push({ category: "vocab", pattern: vc });

  const num = findNumericSequence(password);
  if (num) found.push({ category: "numeric", pattern: num });

  const rep = findRepeat(password);
  if (rep) found.push({ category: "repeat", pattern: rep });

  const yr = findYear(password);
  if (yr) found.push({ category: "date", pattern: yr });

  found.sort((a, b) => SEVERITY[b.category] - SEVERITY[a.category]);
  return found;
}
