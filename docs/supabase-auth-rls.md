# 🔐 Supabase Auth & RLS 보안 구조 및 익명 로그인 가이드

이 문서는 프로젝트 내의 데이터 접근 제어 정책(Row Level Security, RLS)과 인증(Authentication) 흐름을 설명합니다.

---

## 🔑 Supabase 인증 구조

이 프로젝트는 쿠키 기반 세션 유지 방식(Cookie-based Sessions)을 활용합니다.
*   **미들웨어 ([`src/middleware.ts`](file:///Users/ryuhojun/Documents/project/health_app/src/middleware.ts))**: 모든 API 및 페이지 요청 시 세션 검증.
*   **세션 갱신 ([`src/utils/supabase/middleware.ts`](file:///Users/ryuhojun/Documents/project/health_app/src/utils/supabase/middleware.ts))**: 요청마다 Supabase 인증 쿠키를 리프레시하여 사용자를 식별.

### ⚠️ 원인: 401 Unauthorized 오류
백엔드 API 엔드포인트(`start`, `cancel`, `subscribe` 등)는 사용자별 타이머와 구독 정보를 DB에 저장하기 위해 `supabase.auth.getUser()`를 호출합니다.
별도의 회원가입/로그인 화면이 없어 유효한 세션 쿠키가 없으면 `401 Unauthorized` 에러가 발생합니다.

### ✅ 해결 완료: 익명 로그인 자동 초기화
[`src/providers/PushProvider.tsx`](file:///Users/ryuhojun/Documents/project/health_app/src/providers/PushProvider.tsx)의 `useEffect` 마운트 시점에 자동으로 세션을 확인하고, 세션이 없으면 `signInAnonymously()`를 호출합니다.
인증 완료 전까지는 `isAuthReady: false` 상태를 context로 노출하여 API 호출 버튼을 비활성화합니다.


---

## ⚡ 해결 방안: 익명 로그인 (Anonymous Sign-ins)

사용자에게 로그인 UI를 강제하지 않으면서도, 고유한 사용자 세션을 생성하고 DB RLS 정책을 통과하기 위해 **Supabase 익명 로그인** 방식을 적용합니다.

### 1) Supabase 대시보드 설정 (필수)
프로젝트 관리자는 Supabase 대시보드에서 다음과 같이 익명 로그인을 활성화해야 합니다.
1. **Supabase Dashboard**에 접속합니다.
2. **Authentication** -> **Providers** 메뉴로 이동합니다.
3. **Anonymous sign-ins** 항목을 찾아 **Enabled** 상태로 전환(켜기)합니다.

### 2) 클라이언트(PWA) 초기화 로직 구현 흐름
사용자가 앱에 최초 진입(마운트)할 때 세션이 유효한지 확인하고, 비로그인 상태일 경우 자동으로 익명 로그인을 시도합니다.

```typescript
import { createClient } from '@/utils/supabase/client'

const supabase = createClient()

async function initializeAuth() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    // 세션이 없으면 익명 로그인 시도
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) {
      console.error('익명 로그인 실패:', error.message)
      return null
    }
    return data.user
  }
  return user
}
```

익명 로그인이 성공하면 브라우저에 쿠키가 세팅되며, 이후 API 호출 시 헤더를 통해 쿠키가 전송되어 미들웨어 및 API의 `supabase.auth.getUser()`가 정상적으로 통과됩니다.

---

## 🛡️ Row Level Security (RLS) 정책 개요

Supabase 테이블들은 사용자의 개인 정보 보호를 위해 RLS 정책을 엄격히 적용합니다. 익명 로그인된 사용자도 `auth.users`에 고유 UUID가 발급되므로 아래 RLS 필터를 정상적으로 통과합니다.

### 1) `push_subscriptions` RLS
*   **정책**: 사용자 본인의 구독만 조회/수정/삭제 가능
*   **조건**: `auth.uid() = user_id`

### 2) `rest_timers` RLS
*   **정책**: 사용자 본인의 타이머만 조회/생성/수정 가능
*   **조건**: `auth.uid() = user_id`

### 3) `exercises` RLS
*   **정책**: 읽기(SELECT)는 모든 유저 허용, 쓰기는 `service_role` (관리자)만 허용.
*   **조건**: `USING (true)`
