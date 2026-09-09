# 사용자 운동 루틴

## 목표

로그인한 사용자가 자신만의 운동 루틴을 만들고 조회할 수 있게 합니다. 이번 단계에서 루틴은 이름과 순서가 있는 운동 목록으로 구성하며 세트, 횟수, 중량, 휴식 시간은 포함하지 않습니다.

## 사용자 흐름

1. `/routine`에서 본인이 만든 루틴 목록을 확인합니다.
2. `새 루틴`을 선택하면 `/routine/new`로 이동합니다.
3. 루틴 이름을 입력하고 `exercises` 마스터 데이터에서 운동을 검색해 하나씩 추가합니다.
4. 추가된 운동은 선택 순서대로 표시하며 저장 전에는 제거할 수 있습니다.
5. 저장이 완료되면 `/routine/[routineId]`로 이동합니다.
6. 상세 화면은 루틴 이름과 순서대로 정렬된 운동 목록을 표시합니다.

이번 범위에는 루틴 수정, 삭제, 운동 순서 드래그, 세트 구성, 루틴 실행을 포함하지 않습니다.

## 데이터 모델

### `routines`

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `name text not null` 및 공백 제거 후 길이 제한 검사
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `routine_exercises`

- `id uuid primary key default gen_random_uuid()`
- `routine_id uuid not null references routines(id) on delete cascade`
- `exercise_id uuid not null references exercises(id) on delete restrict`
- `position integer not null check (position >= 0)`
- `created_at timestamptz not null default now()`
- `unique (routine_id, exercise_id)`: 같은 루틴 내 중복 운동 방지
- `unique (routine_id, position)`: 정렬 순서 충돌 방지

운동 자체는 전역 마스터인 `exercises`를 참조하고 사용자별 복사본을 만들지 않습니다.

## 보안과 저장 원칙

- 두 신규 테이블 모두 RLS를 활성화합니다.
- `routines.user_id = auth.uid()`인 행만 해당 사용자가 조회하고 생성할 수 있습니다.
- `routine_exercises`는 부모 루틴의 소유자가 현재 사용자일 때만 조회하고 생성할 수 있습니다.
- 클라이언트가 보낸 `user_id`는 신뢰하지 않고 서버에서 검증된 `auth.getUser()` 결과를 사용합니다.
- 루틴과 운동 목록은 중간 실패로 반쪽 데이터가 남지 않도록 하나의 Postgres 함수에서 트랜잭션으로 생성합니다.
- 함수는 호출자의 RLS를 따르는 `security invoker`로 만들고 `authenticated` 역할에만 실행 권한을 줍니다.
- 루틴 상세 조회에서도 ID만으로 접근을 허용하지 않고 RLS 결과가 없으면 `notFound()`를 반환합니다.

## 화면 및 코드 구조

```text
src/app/(main)/routine/
├── page.tsx                         # 사용자 루틴 목록 서버 컴포넌트
├── page.module.css
├── loading.tsx
├── types.ts
├── _data/
│   └── routines.ts                 # 조회 전용 Supabase 함수
├── _actions/
│   └── createRoutine.ts            # 인증, 입력 검증, 생성 RPC 호출
├── _components/
│   ├── RoutineCard/
│   ├── RoutineEmptyState/
│   ├── RoutineForm/
│   └── ExercisePicker/
├── new/
│   ├── page.tsx                    # 운동 마스터 데이터를 폼에 주입
│   └── page.module.css
└── [routineId]/
    ├── page.tsx                    # 소유권이 확인된 루틴 상세
    └── page.module.css
```

- 페이지와 조회 함수는 서버 컴포넌트를 유지합니다.
- 검색, 선택 목록, 제출 상태만 클라이언트 컴포넌트로 격리합니다.
- 배럴 파일을 만들지 않고 구체적인 파일 경로를 import합니다.
- 데이터베이스 타입을 생성해 `src/lib/supabase/database.types.ts`에 두고 서버와 브라우저 클라이언트에 적용합니다.

## 운동 선택 UI

- 이름 검색을 기본으로 제공하고 운동명, 타깃 근육, 장비 종류를 표시합니다.
- 검색 결과의 `추가` 버튼으로 운동을 하나씩 선택 목록에 넣습니다.
- 이미 선택한 운동은 추가할 수 없고 선택 목록에서 제거할 수 있습니다.
- 저장 버튼은 루틴 이름이 비어 있거나 선택 운동이 없거나 제출 중이면 비활성화합니다.
- 운동 데이터가 없을 때와 검색 결과가 없을 때를 서로 다른 빈 상태로 표시합니다.
- 운동 이미지 URL이 있으면 보조 썸네일로 사용하되 이미지가 없어도 정보 구조가 유지되게 합니다.

참고 이미지의 구조 중 검색 중심 운동 목록, 카드형 루틴 목록, 썸네일이 있는 상세 운동 목록을 반영합니다. 원본 앱의 광고, 소셜 메뉴, 운동 실행 버튼과 색상 체계는 복제하지 않습니다.

## 검증 계획

- 사용자 A의 루틴이 사용자 B에게 조회되지 않는지 RLS로 확인합니다.
- 빈 이름, 공백 이름, 운동 0개, 중복 운동 ID, 존재하지 않는 운동 ID를 거부하는지 확인합니다.
- 루틴과 연결 운동이 한 번에 생성되고 선택 순서대로 조회되는지 확인합니다.
- `/routine`, `/routine/new`, `/routine/[routineId]`의 로딩·빈 상태·오류 상태를 확인합니다.
- 상세 페이지에서 다른 사용자의 UUID와 잘못된 UUID가 `404`가 되는지 확인합니다.
- 하단 루틴 탭이 모든 루틴 하위 경로에서 활성화되는지 확인합니다.
- 모바일 390px와 넓은 화면에서 레이아웃을 확인합니다.
- `npm run lint`와 `npm run build`를 실행합니다.

## DB 적용 방법

MCP는 읽기 전용 상태로 유지합니다. Supabase Dashboard의 SQL Editor에서 `supabase/migrations/20260909090000_create_routines.sql` 전체를 한 번 실행합니다. 실행이 끝나면 다음 항목을 확인합니다.

- Table Editor에 `routines`, `routine_exercises`가 생성되어 있음
- 두 테이블의 RLS가 활성화되어 있음
- Database Functions에 `create_routine_with_exercises`가 존재함

DB 적용 전에는 앱 코드가 신규 테이블을 조회할 수 없으므로 `/routine`에서 오류가 발생하는 것이 정상입니다.

## 구현 상태

- `/routine`: 현재 사용자의 루틴 카드 목록과 빈 상태
- `/routine/new`: 이름 입력, 운동명 검색, 부위 필터, 운동 개별 추가·제거, 저장
- `/routine/[routineId]`: 소유권이 확인된 루틴의 운동 목록
- `/api/exercises`: 인증된 사용자를 위한 제한된 운동 검색
- 운동 썸네일 원격 호스트는 `next.config.ts`에서 명시적으로 허용
