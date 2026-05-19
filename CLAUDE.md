# CLAUDE.md — 막번호(MakNumber) 프로젝트 컨텍스트

## 🚨 시작하기 전에

**이 문서를 먼저 끝까지 읽고 작업을 시작하세요.**

> 사용자가 `/시작`, `/종료`, `/완료`, `/막힘`, `/결정`, `/주간정리`, `/상태`
> 같은 명령어를 입력하면 [RITUALS.md](RITUALS.md)를 참조해서 해당 루틴을 수행하세요.

추가로 작업 전 다음을 함께 확인하세요:
- [AGENTS.md](AGENTS.md): **Next.js 16 주의사항.** create-next-app이 만든
  파일이며 "This is NOT the Next.js you know" 라고 명시합니다. App Router
  API/규약/파일 구조에 breaking changes가 있을 수 있으므로 새 API를 쓰기
  전에 `node_modules/next/dist/docs/` 를 먼저 참조하세요.
- [SPEC.md](SPEC.md): 기능 명세 (옵션 동작, 위험 패턴, 프리셋 정의)
- [RITUALS.md](RITUALS.md): 사용자 표준 명령어 사전
- [README.md](README.md): 외부 소개용 문서 (참고용)

---

## 프로젝트 개요

**막번호(MakNumber)** 는 "어차피 다시 안 갈 1회성 사이트"에 쓸 비밀번호를
즉석에서 생성해주는 클라이언트 사이드 웹 도구입니다. 사이트마다 미묘하게 다른
가이드라인(길이, 특수문자, 대소문자, 숫자 포함 여부 등)을 옵션으로 입력하면
조건을 모두 만족하는 비밀번호를 안전한 난수 소스(`crypto.getRandomValues`)로
생성합니다. 서버 전송 없음, 영구 저장 없음 — 새로고침하면 모든 흔적이
사라집니다.

---

## 컨셉과 배경

### 왜 만드는가
- 현대인은 1회성 사이트(이벤트 응모, 단발성 회원가입 등)에 가입할 일이 많음
- 사이트마다 비밀번호 정책이 다르고 미묘함 → 매번 새로 고민하는 비용 큼
- 패스워드 매니저는 무겁고, 그렇다고 "qwerty123" 같은 걸 쓸 수도 없음
- 조건만 입력하면 "막 쓸" 비밀번호를 즉석에서 만들어주는 도구가 필요

### 사용자
- 단발성 가입을 자주 하는 일반 사용자
- 자주 가는 사이트의 중요한 비밀번호는 **본인이 따로 관리**한다는 전제
- 막번호는 "중요하지 않은 사이트 전용" 임을 명확히 인지하고 쓰는 사용자

### 비핵심 (이번 프로젝트에서 하지 않을 것)
- 비밀번호 저장/동기화 기능 (영구 보관은 명시적으로 금지)
- 계정-비밀번호 매핑 기록
- 로그인, 회원가입, 서버 통신
- 모바일 앱화

---

## 기술 스택

| 구분 | 선택 | 실제 설치 | 이유 |
|---|---|---|---|
| 프레임워크 | Next.js 14+ (App Router) | **16.2.6** | 정적 배포 친화, TS 통합, 추후 확장 여지 |
| UI 런타임 | React | **19.2.4** | Next.js 16 동봉 |
| 언어 | TypeScript | ^5 | 타입 안전성, 옵션 객체 명세 명확화 |
| 스타일 | Tailwind CSS | **v4** (`@tailwindcss/postcss`) | 빠른 프로토타이핑, 클래스 일관성. v4는 설정 방식이 v3과 다름 (PostCSS 플러그인 기반, `tailwind.config.js` 기본 없음). |
| UI 컴포넌트 | shadcn/ui | 미설치 | 라이브러리 종속 없는 복붙형, 디자인 통일 |
| 난수 소스 | `crypto.getRandomValues()` | 브라우저 내장 | 암호학적으로 안전. `Math.random()` 절대 금지 |
| 강도 측정 | `zxcvbn` | 미설치 | 패턴 기반 현실적 강도 추정의 사실상 표준 |
| 클립보드 | Clipboard API | 브라우저 내장 | 브라우저 표준, 권한 단순 |
| 배포 (예정) | Vercel / 정적 호스팅 | — | SSR 불필요. 100% 클라이언트 사이드로 동작 |

---

## 아키텍처

```
maknumber/
├── CLAUDE.md              # (본 문서) AI용 프로젝트 컨텍스트
├── SPEC.md                # 사용자 입장의 기능 명세
├── RITUALS.md             # 사용자 명령어 사전
├── README.md              # 공개용 소개 문서
│
├── app/                   # Next.js App Router
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 메인 페이지 ("use client")
│   └── globals.css        # Tailwind 전역
│
├── components/
│   ├── ui/                # shadcn/ui 원시 컴포넌트
│   ├── PasswordOptions.tsx     # 옵션 입력 폼
│   ├── PasswordOutput.tsx      # 생성 결과 + 복사 버튼
│   ├── StrengthMeter.tsx       # zxcvbn 기반 강도 표시
│   ├── DangerWarning.tsx       # 위험 패턴 경고
│   └── PresetSelector.tsx      # 사이트별 프리셋
│
├── lib/
│   ├── generator.ts       # 비밀번호 생성 (조건 보장 알고리즘)
│   ├── strength.ts        # zxcvbn 래퍼
│   ├── dangerPatterns.ts  # 위험 패턴 사전 + 매칭
│   ├── presets.ts         # 프리셋 정의 (네이버/구글/은행/게임 등)
│   └── random.ts          # crypto.getRandomValues 래퍼 (편향 없는 정수 추출)
│
├── types/
│   └── options.ts         # PasswordOptions, Preset, Strength 등 타입
│
└── public/                # 정적 자산
```

각 파일의 역할:
- `lib/random.ts` — **모든 난수 호출의 단일 출입구**. 다른 곳에서 직접
  `crypto.getRandomValues`를 호출하지 말고 이 모듈을 거치도록 한다.
- `lib/generator.ts` — 옵션을 받아 조건을 모두 만족하는 비밀번호 반환.
  "선택한 모든 카테고리에서 최소 1자" 보장이 핵심.
- `lib/dangerPatterns.ts` — 사전 패턴(qwerty, 12345, password 변형 등)
  매칭. 생성 결과뿐 아니라 사용자가 어딘가에 직접 입력할 경우도 검사 가능하게.
- `components/PasswordOutput.tsx` — 생성된 값은 컴포넌트 state 외에 어디에도
  저장되지 않도록 한다.

---

## 핵심 기능 명세 (요약)

상세 동작은 [SPEC.md](SPEC.md) 참조.

1. **옵션 설정** — 길이(4~64), 대문자/소문자/숫자/특수문자 토글, 특수문자
   모드(전체/일부/제외), 혼동 문자 제외(`O/0`, `l/1` 등) 옵션.
2. **비밀번호 생성** — 선택한 카테고리 각각에서 최소 1자 보장 후 나머지를
   조건 풀에서 추출, 셔플. 100% 클라이언트.
3. **복사 버튼** — Clipboard API. 복사 후 시각 피드백 (2초). 클립보드에
   남는 시간을 줄이기 위한 자동 클리어는 별도 검토.
4. **강도 표시** — zxcvbn 점수(0–4) + 추정 크랙 시간 + 시각 게이지.
5. **위험 비밀번호 경고** — `dangerPatterns`에 매칭되면 빨간 경고 + 재생성
   유도.
6. **사이트별 프리셋** — 일반/강화/네이버/구글/은행권/게임. 클릭 시 옵션
   자동 세팅.

---

## 🔒 보안 원칙 (절대 어기지 말 것)

1. **서버 전송 금지** — 생성된 비밀번호는 어떤 fetch/XHR/WebSocket/
   analytics 요청에도 포함하지 않는다. 네트워크 요청 0건이 목표.
2. **영구 저장 금지** — `localStorage`, `sessionStorage`, `IndexedDB`,
   쿠키, URL 쿼리스트링 어디에도 비밀번호를 저장하지 않는다. 옵션 설정값도
   기본은 메모리에만, 명시적 사용자 동의 없이 영구화 금지.
3. **새로고침 시 초기화** — React state로만 보관 → 새로고침으로 자동 소실.
4. **`Math.random()` 사용 절대 금지** — 모든 난수는 `crypto.getRandomValues`
   기반. PRNG 우회 코드(예: 라이브러리 내부의 `Math.random`)가 들어오는 일이
   없는지 의존성 추가 시 점검.
5. **편향 없는 정수 추출** — `crypto.getRandomValues` 결과를 `% N`으로 바로
   쓰면 모듈로 편향이 생긴다. rejection sampling 등으로 균등 분포 보장.
6. **외부 텔레메트리 금지** — 에러 리포팅, 사용자 추적, 광고 SDK 등
   기본적으로 추가하지 않는다. 추가 필요 시 비밀번호가 절대 노출되지
   않는다는 점을 명시적으로 검증.
7. **로깅 금지** — 생성된 비밀번호를 `console.log`로도 찍지 않는다.
   디버깅 중에도 마찬가지.

---

## 코딩 규칙

- **주석은 한국어**로 작성. 단, 변수/함수명은 영어 유지.
- **`crypto.getRandomValues` 사용** — `Math.random()` 절대 금지.
  난수 호출은 `lib/random.ts`를 단일 출입구로.
- **클라이언트 컴포넌트 명시** — 비밀번호 관련 컴포넌트는 파일 최상단에
  `"use client"` 명시. 서버 컴포넌트로 실수 전환되지 않도록.
- **상태는 React state로만** — 비밀번호와 그 파생물(강도 등)은 컴포넌트
  state 또는 메모리 변수에만. 영구 저장 금지.
- **타입 명시** — 옵션, 프리셋, 강도 결과 등은 `types/`에 정의하고 재사용.
- **shadcn/ui 우선** — 새 UI 요소가 필요하면 shadcn에 있는지 먼저 확인 후
  복사. 없으면 그 스타일에 맞춰 만든다.
- **부수효과 없는 순수 함수** — `lib/generator.ts`, `lib/strength.ts` 등
  도메인 로직은 가능한 한 순수 함수로. 테스트하기 쉽게.

---

## 📋 진행 상황 체크리스트

### Phase 0 — 문서 정비
- [x] CLAUDE.md 작성
- [x] SPEC.md 작성
- [x] RITUALS.md 작성
- [x] README.md 작성

### Phase 1 — 프로젝트 부트스트랩
- [x] Next.js 프로젝트 초기화 (실제 설치: 16.2.6 + React 19 + Tailwind v4)
- [x] Tailwind CSS 설정 (v4, PostCSS 플러그인 방식)
- [x] shadcn/ui 초기화 (`button`, `input`, `slider`, `switch`, `tabs` 추가)
- [x] 폴더 구조: `app/`, `components/ui/`, `lib/` 생성 완료. `types/`는
      Phase 2에서 첫 타입 파일과 함께 생성.
- [x] 기본 layout / globals.css (create-next-app 기본값 + shadcn이 globals.css 갱신)

### Phase 2 — 도메인 로직 (lib)
- [x] `lib/random.ts` — 편향 없는 정수 추출 (`randomInt`/`pick`/`shuffle`)
- [x] `types/options.ts` — `PasswordOptions`, `Preset`, `SymbolMode`, `Strength` + `MIN/MAX_LENGTH`
- [x] `lib/generator.ts` — `generate(opts)` + `normalizeOptions(opts)`. 문자 풀 상수 동거.
- [x] `lib/dangerPatterns.ts` — `findDangerPatterns(pw)` 5개 카테고리(keyboard/vocab/numeric/repeat/date), leet 정규화 + 길이 내림차순 사전
- [x] `lib/strength.ts` — zxcvbn 동적 import 래퍼, 한국어 라벨 + 한국어 크랙 시간 포맷
- [x] `lib/presets.ts` — 6개 프리셋(general/strong/naver/google/bank/game) + `DEFAULT_PRESET_ID`

### Phase 3 — UI 컴포넌트
- [x] `PasswordOptions.tsx` — 길이 슬라이더+숫자입력, 카테고리 4개 스위치, 특수문자 모드 3버튼, 혼동 제외 스위치
- [x] `PasswordOutput.tsx` — 모노스페이스 결과 + 복사(2초 피드백) + 새로 만들기
- [x] `StrengthMeter.tsx` — 5칸 게이지 + 한국어 라벨 + 크랙 시간
- [x] `DangerWarning.tsx` — 빨간 배너 + 상위 2개 패턴 + 재생성 버튼
- [x] `PresetSelector.tsx` — shadcn Tabs로 6개 프리셋
- [x] `app/page.tsx` — 조립, dev server HTTP 200 검증

### Phase 4 — 마감
- [x] 반응형 — `sm:` 브레이크포인트로 모바일/데스크톱 동시 대응. 비번 박스
      `text-4xl` (모바일) / `text-5xl` (sm:), `break-all` 로 긴 비번 자동 줄바꿈.
- [x] 접근성 — 모든 인터랙티브에 시맨틱 요소(`button`/`label`) + aria
      (`aria-expanded`/`aria-controls`/`aria-pressed`/`role=alert`/
      `role=progressbar`/`role=status`/`aria-live`) 적용. `lang="ko"`.
- [x] **네트워크 요청 0건 (정적 분석)** — `fetch/axios/XHR/WebSocket/
      sendBeacon/EventSource` 소스 코드 0건, 외부 URL 참조 0건. 빌드된
      `out/index.html`에도 외부 도메인 0건(SVG namespace 제외).
      DevTools 라이브 검증은 출시 후 한 번 더.
- [x] `Math.random` 부재 — 소스에서 "금지 명시 주석"에만 등장, 실제 호출 0건.
- [x] 새로고침 시 상태 초기화 — `localStorage`/`sessionStorage`/`IndexedDB`/
      `cookie` 소스 0건. 모든 상태는 React state 만 사용.
- [x] **빌드 + 정적 export 통과** — `next.config.ts` 에 `output: "export"`,
      `npm run build` 성공. 결과는 `out/` 폴더, 약 2.1MB.
- [x] README 로컬 실행 + 배포 안내 채움 (`npx serve out` / Vercel / Netlify /
      GitHub Pages / S3 등).

### Phase 5 — 출시 + 출시 후 폴리시 (2026-05-19 신규)
- [x] **🚀 v1.0 출시** — https://maknumber.vercel.app (Vercel + GitHub).
- [x] GitHub 저장소 public 전환 (보안 도구 신뢰성 ↑).
- [x] MIT 라이선스 (`LICENSE` 파일 + README 명시).
- [x] Open Graph + Twitter card 메타데이터 (`app/layout.tsx`).
- [x] 커스텀 favicon (`app/icon.svg`, 자물쇠 SVG) — Next 기본 ICO 제거.
- [x] `robots.ts` + `sitemap.ts` (정적 export 호환 `force-static`).
- [x] 라이트모드 hue=250 슬레이트 톤으로 다크와 일관성.
- [x] 슬로건 톤다운: `어차피 다시 안 갈 사이트` → `막 쓸 비밀번호, 편하게 막 만들어요`.
- [x] **동적 OG 이미지** (`app/opengraph-image.tsx`, 1200×630 PNG, 빌드 시
      생성) — Noto Sans KR 600/700/800 임베드로 한글 깨짐 방지.
- [x] DangerWarning amber 톤 + `role="alert"`.

---

## ➡️ 다음 작업 우선순위

**전체 로드맵 (2026-05-19 출시 후 갱신):**

```
1. Stage 1.x           ✅ 완료
2. Phase 4 마감        ✅ 완료
3. 출시                ✅ 완료 — https://maknumber.vercel.app
4. 출시 후 폴리시       ✅ 완료 (라이선스/favicon/robots/sitemap/OG 메타/OG 이미지/슬로건/라이트 톤/저장소 public 전환)
5. (모니터링)          🚧 진행 중 — 사용자 피드백 수집 후 Stage 2/3 결정
```

**1순위: 출시 후 모니터링 (행동 없는 단계)**

- 코드/문서 변경 없음. **친구·동료에게 URL 공유하고 실사용 피드백 누적**.
- 피드백이 모이기 전엔 추가 기능 보류. "1회용 도구"의 단순함 유지가 핵심
  정체성.
- 잠재 후속 — 피드백이 강하게 요구하면 그때:
  - Stage 2 (편집·실시간 평가, `lib/evaluator.ts` 분리) — 약 1일
  - Stage 3 (세션 히스토리, 메모리 only) — 약 1일
- Vercel Production Checklist의 **Web Analytics / Speed Insights는 절대
  켜지 말 것** — 푸터의 "추적 없음" 약속 위반. `default-src 'self'` CSP
  단순성도 깨짐.
- 다음 채팅에서 사용자가 새 작업을 가져오기 전까지 우리는 멈춤 상태.

**주의:**
- Next.js 16은 14/15와 breaking changes 있음. 새 API 쓰기 전에 AGENTS.md가
  안내한 대로 `node_modules/next/dist/docs/` 참조.
- Tailwind v4: `tailwind.config.js` 없음. CSS 변수 기반 테마는
  `app/globals.css` 안에 있음.
- 비밀번호 관련 컴포넌트는 `"use client"` 필수. App Router 기본은 서버
  컴포넌트.
- React 19 `react-hooks/set-state-in-effect` 룰: mount-only effect 또는
  외부 시스템 동기화 외에는 setState in effect 금지. 옵션→비번 갱신은
  이벤트 핸들러에서 함께 처리(`applyOpts` 패턴).

---

## 📝 Decision Log

### 2026-05-19 — 📱 모바일 실기기 테스트 결과 (iPhone 17 Pro)
사용자가 라이브 사이트를 iPhone 17 Pro 에서 직접 테스트해 9개 피드백 정리.

**🔥 우선 (이번에 반영):**
1. **비번 줄바꿈 부자연** — 12자 비번이 10+2 로 분할. 모바일 폰트가 `text-4xl`
   로 너무 크다. → `text-3xl sm:text-5xl` 로 모바일 한 단계 다운.
2. **"생성된 비밀번호" 라벨 제거** — 박스 안의 안내 라벨이 첫 화면 점유를 키움.
   비번 자체가 충분히 명확하므로 라벨 자체 삭제.
3. **첫 화면 정보 밀도 부족** — 헤더/박스 패딩이 데스크톱 기준이라 모바일에서
   옵션 영역이 화면 거의 안 보임. 모바일에서 헤더·박스 패딩 축소, 섹션 간격
   축소 → 한 화면에 "헤더 + 비번 + 액션 + 강도 + 프리셋 + 옵션 토글" 까지 노출.

**⚡ 다음 (이번에 반영, 6은 별도):**
4. **자물쇠 아이콘 모바일 축소** — `size-10` → `size-8 sm:size-10`.
5. **다크모드 토글 터치 영역** — `size-9` (36×36) → `size-11` (44×44).
   Apple HIG 권장 최소 터치 타깃 44pt 충족.
6. **강도 라벨 vs 크랙 시간 일관성** — 12자 매우 강함인데 "3년"이 약해 보임.
   zxcvbn `offline_slow_hashing_1e4_per_second` 시나리오 추정이 보수적이라
   엔트로피 ~41bit 로 측정됨(실제 ~73bit). **별도 단계에서 시나리오 검토 후
   결정** — 라벨 일관성 / 시나리오 변경 / 시간 표시 단순화 중 선택.

**🌱 여유 (다음 차):**
7. 햅틱 피드백 (iOS Vibration API). 복사·재생성 시.
8. 모노스페이스 폰트를 JetBrains Mono 로 검토.
9. iOS Safe Area `env(safe-area-inset-*)` 확인 (notch/Home indicator).

### 2026-05-19 — 슬로건 톤다운 + 동적 OG 이미지
- **새 슬로건**: `막 쓸 비밀번호, 편하게 막 만들어요` (사용자 선택).
  기존 `어차피 다시 안 갈 사이트, 막 쓸 비밀번호`가 약간 시니컬하게 느껴진다는
  피드백을 반영. "막"이 두 번 반복되어 "막번호" 브랜드와 자연스럽게 연결되고
  톤도 친근해짐. page 헤더 부제 / layout 메타 / README / SPEC 와이어프레임에
  일괄 적용. CLAUDE.md 프로젝트 개요와 SPEC.md 사용자 시나리오 본문의
  "어차피 다시 안 갈"은 컨셉 정의라 유지.
- **동적 OG 이미지 채택**: `app/opengraph-image.tsx` + `next/og` 의
  `ImageResponse` 사용. 빌드 시점에 1200×630 PNG가 정적 파일로 생성되어
  `output: "export"` 와 충돌 없음(`force-static` 명시).
- **한글 폰트 임베드**: `@fontsource/noto-sans-kr` devDependency 추가.
  `node_modules/@fontsource/noto-sans-kr/files/` 에서 600/700/800 weight
  `.woff` 를 `fs.readFile` 로 직접 임베드. 폰트 누락 시 한글이 □ 로 렌더되는
  사태 방지. CDN/외부 fetch 없이 빌드 타임 로컬 파일.
- **OG 이미지 디자인**: 다크 슬레이트 그라데이션 + 흰 카드 안 자물쇠 +
  큼지막한 "막번호" + 슬로건 + 모노 비번 미리보기 `kX3$mP9aWq2!`. 한눈에
  "비번 생성기"임을 알 수 있게.
- **opengraph.xyz 진단의 "Title/Description 짧음"은 무시**: SEO 권고 50~60자
  / 110~160자는 영어 기준. 한글은 글자당 정보 밀도가 2~3배라 현재 18자/59자도
  충분. og:image 누락만 의미 있는 경고였고 이번에 해소.

### 2026-05-19 — 출시 후 폴리시 묶음
- **MIT 라이선스 채택**: 가장 단순한 오픈소스 라이선스, 보안 도구 코드를
  누구나 검증·재사용 가능하게.
- **GitHub 저장소 public 전환**: 보안 도구의 "서버 전송 없음·저장 없음"
  주장을 코드 차원에서 검증 가능하게 함. 신뢰도 핵심. 환경변수/시크릿/개인
  정보 0건이라 안전(`.env*`, `.claude/`, `.vercel` 등 모두 `.gitignore`).
- **커스텀 favicon (`app/icon.svg`)**: Next.js 기본 ICO 대체. 검정 둥근 카드
  + 흰색 자물쇠. Next App Router 가 자동으로 `<link rel="icon">` 헤더 생성.
- **`robots.ts` + `sitemap.ts` 정적 export 호환 이슈**: Next 16에서 두
  라우트는 기본 dynamic. `output: "export"` 와 빌드 충돌. `export const
  dynamic = "force-static"` 명시로 해결. `lastModified` 도 빌드 시점 정적
  문자열(`"2026-05-19"`) 사용.
- **라이트모드도 hue=250 슬레이트 톤**: 다크 모드만 살짝 푸른빛이고 라이트는
  순수 무채색이던 비대칭 해소. 두 모드 모두 일관된 보안 도구 톤.
- **DangerWarning red → amber 전환 + `role="alert"`**: 강도 게이지의
  빨강(score=0)과 시각 충돌 방지. 접근성에서도 동적 경고 영역 명시.

### 2026-05-19 — 🚀 v1.0 출시 (Vercel + GitHub)
- **라이브 URL**: https://maknumber.vercel.app (HTTPS 자동, 전 세계 CDN).
- **소스 저장소**: https://github.com/dandanhandol/maknumber (현재 private,
  공개 전환은 별도 결정).
- **첫 커밋**: `6646f05` "Initial commit: 막번호 v1.0" — 40 파일,
  12,780 insertions.
- **자동 배포 흐름 확립**: `main` 브랜치 push → Vercel 자동 빌드·배포.
- **외부 검증 통과**: HTTP 200, HSTS 보안 헤더 자동, 응답 32KB, 한국어 UI
  14개 키워드 모두 SSR, 외부 도메인 참조 0건(vercel.app·w3.org 제외).
- **Vercel Web Analytics / Speed Insights 비활성화 유지**: 푸터의 "추적
  없음" 약속과 충돌. Production Checklist 권유에도 켜지 않음.
- **개발 기간**: 2026-05-18 ~ 2026-05-19 (2일, 문서→코드→출시 전 과정).

### 2026-05-19 — Phase 4 마감 + 정적 export 채택
- **`next.config.ts` 에 `output: "export"` 채택**. 막번호는 100% 클라이언트
  사이드 동작이라 SSR 런타임 불필요. 빌드 결과(`out/`)가 그대로 정적
  사이트 → Vercel/Netlify/GitHub Pages/S3 어디든 업로드만 하면 동작.
- **CSP 단순화 효과**: 외부 도메인 요청 0건이라 `default-src 'self'` 만으로
  완전한 정책 설정 가능.
- **정적 분석 7종 통과**: `Math.random`(주석 외 0건) / 영구 저장소 0건 /
  네트워크 호출 0건 / 외부 URL 0건 / `console.*` 0건 / 빌드된 HTML 외부
  도메인 0건(SVG namespace 제외).
- **접근성 보강**: DangerWarning 에 `role="alert"` + `aria-live="polite"`
  추가. 스크린리더가 위험 패턴 감지 즉시 알림.
- **빌드 산출물**: `out/` 약 2.1MB. 큰 청크는 `zxcvbn` 사전(약 832KB)인데
  동적 import 이므로 첫 페이지 로드에는 미포함, 강도 측정 시점에만 다운로드.

### 2026-05-19 — "일부" 특수문자 풀 4 → 8자 확장 + 보안 기준 명문화
- **변경**: `SYMBOL_POOLS.safe` 를 `!@#$` (4자) → `!@#$%^&*` (8자).
- **사유**:
  - 사용자 피드백 문서의 원래 예시가 8자였으나 1차 SPEC 작성 시 보수적
    판단으로 4자만 채택했음(불일치 발견).
  - 8자도 충분히 호환성 높고, 비밀번호 다양성·강도 측면에서 더 적절.
- **"일부" 풀 선정 기준 명문화** (SPEC.md §2.3):
  1. 호환성 — 대부분의 일반 웹사이트가 허용.
  2. 보안 — 서버측 입력 검증·이스케이프 실수로 사고가 잦은 문자는 제외.
     SQL injection / XSS / command injection / path traversal 등의 공격
     벡터로 빈번히 쓰이는 `.` `'` `"` `;` `<` `>` `\` `/` `` ` `` `|` `(` `)`
     `?` `,` `:` 는 일부에 미포함, 전체에만 포함.

### 2026-05-19 — Stage 2/3 보류, 출시 우선
- **결정**: Stage 2(편집·실시간 평가 + `lib/evaluator.ts` 분리), Stage 3
  (세션 히스토리, 메모리 only)는 **출시 후 실사용 피드백을 보고** 진행
  여부와 우선순위를 결정한다.
- **새 작업 순서**:
  1. Stage 1 잔여 (1.3 프리셋 위치 이동 + 옵션 접힘 → 1.4 풀 표기 + 푸터
     강화)
  2. Phase 4 마감 (반응형 · 접근성 · 네트워크 0건 검증 · `npm run build`)
  3. 출시 준비 (README 배포 가이드 보강, 정적 호스팅)
- **사유**:
  - 핵심 기능(생성·복사·강도·위험 패턴·프리셋)은 완성됐고 출시 가능 상태.
  - 추가 기능을 미리 만들기보다 실사용자 행동 데이터를 받고 진짜 필요한
    기능에 투자하는 게 효율적.
  - "1회용 도구"라는 제품 정체성상 기능 폭증보다 단순함 유지가 더 가치.
- **GitHub 링크 제외**: 푸터 "코드 확인하기 →" 자리는 만들지 않음. 오픈소스
  공개 결정 시 별도 결정사항으로.

### 2026-05-19 — Stage 1.1 ~ 1.2 (테마 인프라 + 비번 박스 주인공화)
- **다크 모드**: 토글 버튼(헤더 우측) 제공, 첫 paint 는 시스템
  `prefers-color-scheme` 추종(no-flash inline script). 토글 결과는 React
  state 만 — 영구 저장 금지 원칙 유지(새로고침 시 시스템 추종으로 복귀).
- **폰트**: Pretendard 도입 대신 시스템 한글 폰트 fallback 으로 결정
  (Apple SD Gothic Neo, Malgun Gothic, system-ui). **외부 폰트 네트워크
  요청 0건** 유지가 우선이라 npm 정적 패키지/CDN 모두 회피.
- **색감**: 다크 모드 배경/카드/muted 토큰에 hue=250(슬레이트/네이비)
  미세 채도 추가(보안 도구 톤). 라이트 모드는 기존 무채색 유지.
- **위험 경고 색**: 빨강 → 앰버(`amber-500/600`)로 전체 교체. 강도
  게이지의 빨강(score=0)과 시각 구분되어 의미 충돌 감소.
- **비번 박스 주인공화**: `text-2xl/3xl` → `text-4xl/5xl`,
  `p-5` → `p-7 sm:p-9`, `border` → `border-2`. 컨테이너도 `max-w-xl` →
  `max-w-2xl` 로 넓혀 `sm:` 브레이크포인트가 작동하도록.
- **클릭→복사·user-select:all 최종 제거** (사용자 요청). 박스는 단순 표시
  영역으로 환원, 사용자가 마우스로 자유롭게 드래그·부분 선택 가능. 복사는
  "복사" 버튼만, 직후 화면 하단 토스트 + 버튼 ✓ 라벨로 피드백. "복사" =
  default(메인), "새로 만들기" = outline(보조).
- **혼동 문자 라벨 표기**: `(O/0, l/1, I)` → `(O, 0, l, 1, I)` (모두 쉼표
  구분). 모노스페이스 유지.

### 2026-05-18 — Phase 2/3 마무리 (presets, strength, UI 5종, page 조립)
- **zxcvbn 동적 import.** `lib/strength.ts` 안에서 한 번만 로딩되도록
  `Promise` 캐시. 첫 호출 전에는 chunk가 다운로드되지 않아 초기 로드가
  가볍다. `@types/zxcvbn` 설치, `offline_slow_hashing_1e4_per_second` 시나리오
  사용. 크랙 시간은 영어 원문 대신 우리가 한국어로 직접 포맷(초/분/시간/일/
  개월/년/세기/사실상 무한).
- **shadcn Slider는 `@base-ui/react/slider` 기반.** `onValueChange`의 인자가
  `number | readonly number[]`로 union이라 단일 값 destructure가 실패.
  `Array.isArray` 분기로 안전하게 처리.
- **React 19의 `react-hooks/set-state-in-effect` 룰 대응.** 옵션 변경 →
  비밀번호 재생성을 `useEffect`에서 분리, `applyOpts(next)` 헬퍼로 옵션
  설정과 generate를 같은 이벤트 핸들러에서 함께 호출. mount 시 첫 생성은
  hydration mismatch 회피 목적으로 effect 유지(룰 disable, 사유 주석).
- **Hydration 안전성.** `useState`로 `pwd`의 초기값을 빈 문자열로 두고 mount
  후 effect에서 첫 generate. SSR이 빈 placeholder("생성 중…")를 그린 뒤
  클라이언트가 hydration → effect에서 실제 비밀번호 생성. 서버/클라이언트
  HTML 차이 없음.
- **UI 검증**: HTTP 200, 모든 한국어 UI 텍스트가 SSR된 HTML에 포함, dev
  server 로그 에러 0건. 실제 인터랙션은 브라우저에서 사용자 검증 필요.

### 2026-05-18 — Phase 2 (`lib/dangerPatterns.ts`)
- **5개 카테고리(keyboard/vocab/numeric/repeat/date)** 각각 첫 매치 1개만
  반환하고, 위험도(SEVERITY 맵)로 정렬해 내보냄. UI는 상위 1~2개만 표시.
- **leet 정규화 전략**: `1`은 `i`/`l` 둘 다 가능하므로 두 가지 변형을 모두
  타깃 문자열로 만들어 매칭. 나머지(`0/3/4/5/7/@/$`)는 단일 매핑. 사전에는
  정상형만 두고 leet 변형은 코드로 처리.
- **사전은 길이 내림차순 정렬**(모듈 로드 시 1회 `.sort()`). 부분 매칭에서
  더 정보적인 긴 패턴이 먼저 잡힌다.
- **같은 숫자 반복(`1111`)은 numeric이 아니라 repeat 카테고리에 일임** —
  SPEC §3.1 B와 E가 중복되는 영역. 더 일반적인 E로 통일.
- **연도 매칭은 휴리스틱(false positive 허용)** — `\b` 경계 없이 substring
  검출. 비밀번호 안에 4자리 연도가 우연히 들어가는 빈도가 높으나 SPEC
  의도대로 그대로 두고 UI가 상위 1~2개만 표시해 노이즈 완화.
- **sanity 통과**: 10개 케이스(qwerty123, Passw0rd!, asdf1234, aaaa1234,
  MyDog2020, 비밀번호abc, P@ssw0rd, kZxR9pQm, 9876543, abc1111) 모두 SPEC
  기대대로 매칭. `node --experimental-strip-types` 로 직접 실행.

### 2026-05-18 — Phase 2 (`lib/generator.ts`)
- **`generate(opts)` 알고리즘**: ① 각 활성 카테고리에서 1자씩 뽑아 보장,
  ② 남은 자리 = `length - 카테고리수` 만큼 결합 풀에서 균등 추출,
  ③ 전체 셔플로 위치 편향 제거.
- **`normalizeOptions(opts)`로 합법성 보정**: 길이 클램프, 카테고리 수
  하한, `symbolMode === "off"` 시 symbols 강제 false, 모든 카테고리가
  꺼지면 lowercase로 폴백(안전망).
- **문자 풀 상수는 generator.ts 안에 둠** — 도메인 로직과 결합도가 높아
  types에 분리하지 않음. 변경하려면 SPEC.md §2.3/§2.4와 동기화 필요.
- **`buildPools`가 `string[][]`을 반환** — 코드포인트 단위로 미리 분해해
  `pick()` 호출 시 반복 split 비용을 없앰.

### 2026-05-18 — Phase 2 시작 (`types/options.ts`, `lib/random.ts`)
- **`lib/random.ts`** — `randomInt(maxExclusive)` 는 32-bit unsigned 난수에
  rejection sampling을 적용해 모듈로 편향을 제거. `pick`, `shuffle`(Fisher-
  Yates)도 같은 출입구를 통한다. 무한 루프 상한을 두지 않은 이유는
  `maxExclusive ≤ 2^32` 조건에서 reject 확률이 항상 1/2 미만이라
  실질적으로 한두 번 안에 종료되기 때문(주석에 명시).
- **`types/options.ts`** — `PasswordOptions`/`Preset`/`SymbolMode`/
  `Strength` + `MIN_LENGTH(4)`/`MAX_LENGTH(64)` 상수. 문자 풀 상수는 도메인
  로직과 결합도가 높아 `lib/generator.ts` 와 함께 두기로 보류.
- **lint·typecheck 통과.** `Math.random`은 전체 코드에 없음(검증 완료).

### 2026-05-18 — Phase 1 부트스트랩 결과 (보충)
- **shadcn/ui 설치 OK.** `style: "base-nova"`, `baseColor: "neutral"`,
  `iconLibrary: "lucide"`. 추가 의존성: `@base-ui/react`, `cva`, `clsx`,
  `tailwind-merge`, `tw-animate-css`, `lucide-react`. v4 자동 감지됨.
- **컴포넌트 추가:** `button`, `input`, `slider`, `switch`, `tabs`.
- **dev server 부팅 검증 통과** — Turbopack, 265ms, HTTP 200.
- **Next.js 텔레메트리 비활성화.** `npx next telemetry disable` 실행.
  보안 원칙(외부 텔레메트리 금지)과 일치. **주의: 이 설정은 머신 전역
  (`~/Library/Preferences/nextjs-nodejs/config.json`)이라 다른 Next.js
  프로젝트에도 적용됨.** 사용자가 원하면 `npx next telemetry enable`로 복원.

### 2026-05-18 — Phase 1 부트스트랩 결과
- **실제 설치 버전: Next.js 16.2.6 / React 19.2.4 / Tailwind v4.**
  `create-next-app@latest` 가 기본으로 잡아준 조합. 원래 가정은 "14+" 였고
  16도 그 범주에 들어가지만, App Router/규약/파일 구조에 breaking changes가
  있을 수 있음.
- **AGENTS.md 발견.** create-next-app이 `<!-- BEGIN:nextjs-agent-rules -->`
  블록으로 "This is NOT the Next.js you know" 경고를 남김. 새 API 사용 전
  `node_modules/next/dist/docs/` 참조 권장. CLAUDE.md 상단에서 참조하도록 함.
- **Tailwind v4 채택 (자동).** `tailwind.config.js` 대신 PostCSS 플러그인
  방식. shadcn/ui와의 호환은 다음 단계에서 확인. 비호환 시 v3 다운그레이드
  또는 shadcn 미사용을 검토.
- **README.md / CLAUDE.md 충돌 처리.** create-next-app이 만든 기본
  README.md와 한 줄짜리 CLAUDE.md(@AGENTS.md 참조)는 우리 문서로 덮어씀.
  AGENTS.md는 보존.

### 2026-05-18 — 프로젝트 시작 및 핵심 기술 결정
- **Next.js App Router 채택** — 정적 export 가능, TS/Tailwind 통합이
  매끄러움. SPA로도 충분하지만 추후 정적 페이지(가이드, FAQ 등) 확장 여지.
- **`crypto.getRandomValues` 단일 출입구(`lib/random.ts`)** — 미래에
  실수로 `Math.random`이 섞이는 사고를 막기 위해 모든 난수 호출을 한 모듈로
  강제. 모듈로 편향 방지(rejection sampling)도 여기서 처리.
- **zxcvbn 채택** — 강도 측정의 사실상 표준. 사전/패턴 기반 추정이
  엔트로피만 따지는 방식보다 사용자에게 의미 있음. 번들 크기 우려는
  동적 import로 대응 검토.
- **영구 저장 0** — 컨셉상 "1회용" 도구이므로 저장 기능을 추가하지 않는
  것이 보안적으로도, 제품적으로도 옳다. 추후에도 옵션 프리셋 즐겨찾기
  같은 기능을 추가할 때조차 비밀번호 자체는 절대 저장하지 않는다.
- **서버 통신 0** — 정적 호스팅으로 충분. 분석/텔레메트리 SDK도 기본
  미포함. 추후 어떤 서드파티 스크립트를 추가하더라도 비밀번호 메모리
  공간을 건드릴 수 없음을 검증해야 추가 가능.

---

## 🔄 작업 루틴

사용자가 다음 명령어를 입력하면 [RITUALS.md](RITUALS.md)를 참조해 해당
루틴을 수행하세요.

- `/시작` — 작업 시작 루틴 (컨텍스트 파악 + 오늘 후보 추천)
- `/종료` — 작업 종료 루틴 (CLAUDE.md/Decision Log 업데이트)
- `/완료` — 단위 작업 완료 (체크리스트 ✅)
- `/막힘` — 막혔을 때 (대안 3개 제시)
- `/결정 [내용]` — 방향 전환 (Decision Log 기록)
- `/주간정리` — 주간 회고 + 문서 정합성 점검
- `/상태` — 빠른 3줄 요약 (업데이트 X)

### 루틴 사용 시 주의사항
- 루틴 명령어가 들어오면 **다른 작업보다 먼저** 수행
- 루틴 도중 사용자가 다른 질문을 하면 일단 답하고, 루틴 재개 여부 확인
- CLAUDE.md 업데이트는 항상 **변경 차이점을 보여주고 사용자 확인을 받기**
  (사용자가 모르는 사이 문서가 바뀌면 안 됨)
