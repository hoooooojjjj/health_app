# 프로젝트 구조 및 Co-location 규칙

## 기본 원칙

이 프로젝트는 Next.js 16 App Router를 사용합니다. Pages Router용 `pages` 폴더를 별도로 만들지 않고, 라우팅 파일과 화면 전용 구현을 `src/app` 내부에 함께 배치합니다.

- `page.tsx`, `layout.tsx`, `route.ts`는 라우팅과 조합만 담당합니다.
- 특정 화면에서만 사용하는 컴포넌트, 훅, 타입, 상수, 유틸은 해당 라우트의 Private Folder에 둡니다.
- 폴더 이름이 URL에 포함되면 안 되는 화면 그룹은 `(main)`, `(auth)`와 같은 Route Group을 사용합니다.
- `_components`, `_hooks`, `_providers`처럼 밑줄로 시작하는 폴더는 라우팅 대상에서 제외된 구현 세부 사항입니다.
- 배럴 파일은 사용하지 않고 실제 파일 경로를 직접 import합니다.

## 소유권에 따른 위치

### 화면 전용 코드

메인 캘린더처럼 한 라우트에서만 사용하는 코드는 해당 라우트 아래에 둡니다.

```text
src/app/(main)/
├── page.tsx
├── page.module.css
└── _components/WorkoutCalendar/
    ├── WorkoutCalendar.tsx
    ├── WorkoutCalendar.module.css
    ├── constants.ts
    ├── types.ts
    ├── hooks/useWorkoutCalendar.ts
    └── utils/calendar.ts
```

### 전역 코드

- `src/components`: 두 개 이상의 라우트에서 실제로 사용하는 공통 UI
- `src/hooks`: 여러 기능에서 공유하는 React 훅
- `src/lib`: Supabase처럼 외부 서비스나 런타임에 의존하는 공용 인프라
- `src/utils`: React와 외부 서비스에 의존하지 않는 공용 순수 함수
- `src/app/_providers`: 루트 레이아웃이 소유하는 전역 Context Provider

처음부터 재사용을 예상해 전역으로 올리지 않습니다. 두 개 이상의 사용처가 확인될 때 화면 내부 코드를 전역 폴더로 승격합니다.

## 컴포넌트 내부 분리 기준

- 컴포넌트 파일은 JSX 구조와 이벤트 연결을 담당합니다.
- 상태와 React 생명주기 로직은 복잡도가 생기면 `hooks`로 분리합니다.
- 날짜 계산처럼 React에 의존하지 않는 로직은 `utils`로 분리합니다.
- 해당 기능에서만 쓰는 타입과 상수는 컴포넌트 루트의 `types.ts`, `constants.ts`에 둡니다.
- 스타일은 `*.module.css`를 컴포넌트와 같은 폴더에 둡니다.

## App Router 경계

- 브라우저 상태나 이벤트가 필요한 컴포넌트에만 `'use client'`를 선언합니다.
- 서버 컴포넌트는 클라이언트 컴포넌트에 직렬화 가능한 값만 전달합니다.
- API Route Handler는 반드시 `src/app/api` 아래에 유지합니다.
- 요청 전 인증 세션 갱신과 접근 제어는 `src/proxy.ts`에서 시작하고, 실제 Supabase 세션 로직은 `src/lib/supabase/session.ts`가 담당합니다.

## 기존 프로토타입

현재 사용하지 않는 `RestTimer`, `WorkoutSession`, `useRestTimer`, `volumeCalc`는 기능 요구사항과 실제 라우트가 정해질 때 이동합니다. 새 코드는 이 임시 구조를 복제하지 않습니다.
