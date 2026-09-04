# 🔐 Supabase Auth & RLS 보안 구조 및 이메일 로그인 가이드

이 문서는 프로젝트 내의 데이터 접근 제어 정책(Row Level Security, RLS)과 인증(Authentication) 흐름을 설명합니다.

---

## 🔑 Supabase 인증 구조

이 프로젝트는 쿠키 기반 세션 유지 방식(Cookie-based Sessions)을 활용하여 사용자를 식별하고 권한을 통과시킵니다.
*   **Proxy (`src/proxy.ts`)**: 모든 API 및 페이지 요청 시 세션을 검증합니다.
*   **세션 갱신 및 리다이렉트 (`src/lib/supabase/session.ts`)**:
    *   요청마다 Supabase 인증 쿠키를 리프레시하여 최신 사용자 세션을 확보합니다.
    *   **비로그인 사용자**: 보호된 경로(예: 홈 `/`)에 접근 시 `/login` 페이지로 강제 리다이렉트합니다.
    *   **로그인 사용자**: 이미 로그인된 상태에서 로그인 페이지(`/login`)에 접근 시 홈 `/`로 리다이렉트합니다.
    *   **API 경로 보호**: `/api/*` 경로로 들어오는 비인가 API 호출에 대해서는 리다이렉트 대신 `401 Unauthorized` JSON 응답을 반환합니다.
    *   **검증 제외 대상**: 정적 에셋 및 QStash 푸시 발송 API(`/api/push/fire`)는 외부 스케줄러 연동을 위해 세션 검증에서 제외됩니다.

---

## ⚡ 로그인 및 회원가입 흐름 (Email / Password Auth)

사용자는 `/login` 화면에서 이메일과 비밀번호를 사용하여 로그인 또는 회원가입을 수행할 수 있습니다.

### 1) Supabase 대시보드 설정
회원가입 후 이메일 인증 절차 없이 즉시 로그인할 수 있도록 다음과 같이 설정을 조율하는 것을 권장합니다.
1. **Supabase Dashboard**에 접속합니다.
2. **Authentication** -> **Providers** -> **Email** 항목을 클릭합니다.
3. **Confirm email** 설정을 비활성화(Off)로 전환하고 저장합니다.

### 2) 인증 관련 클라이언트 API 연동
클라이언트 컴포넌트에서는 `@/lib/supabase/client`에서 제공하는 `createClient`를 활용하여 Supabase 인스턴스를 얻고 로그인/회원가입/로그아웃을 수행합니다.

* **로그인**:
  ```typescript
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  ```
* **회원가입**:
  ```typescript
  const { data, error } = await supabase.auth.signUp({ email, password })
  ```
* **로그아웃**:
  ```typescript
  const { error } = await supabase.auth.signOut()
  ```

---

## 🛡️ Row Level Security (RLS) 정책 개요

Supabase 테이블들은 사용자의 개인 정보 보호를 위해 RLS 정책을 엄격히 적용합니다. 로그인된 사용자(`auth.users` 테이블에 생성된 고유 UUID)는 아래 RLS 조건을 충족하여 자원에 안전하게 접근합니다.

### 1) `push_subscriptions` RLS
*   **정책**: 사용자 본인의 구독만 조회/수정/삭제 가능
*   **조건**: `auth.uid() = user_id`

### 2) `rest_timers` RLS
*   **정책**: 사용자 본인의 타이머만 조회/생성/수정 가능
*   **조건**: `auth.uid() = user_id`

### 3) `exercises` RLS
*   **정책**: 읽기(SELECT)는 모든 유저 허용, 쓰기는 `service_role` (관리자)만 허용
*   **조건**: `USING (true)`
