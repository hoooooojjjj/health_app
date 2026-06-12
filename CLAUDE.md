# Health App - Technical Guide & Context (AI Agent Instructions)

이 문서는 AI 코딩 에이전트가 컨텍스트 스위칭 시에도 프로젝트의 기술적 설계, 아키텍처 및 구현 규칙을 유지하기 위해 읽는 기술 스택 지침서입니다.

---

## 🚀 1. Runtime & Build Commands

* **Local Development Server:**
  ```bash
  npm run dev
  ```
* **Production Build Verification:**
  ```bash
  npm run build
  ```
* **Linting:**
  ```bash
  npm run lint
  ```

---

## 🛠️ 2. Technology Stack & Architectural Context

### 1) Next.js 15+ (App Router)
* **SSR (Server-Side Rendering) Priority**: 개인 건강 정보 데이터 보호를 위해 클라이언트에 DB 쿼리 로직이 노출되지 않도록 서버 컴포넌트(`Server Component`)에서 데이터를 페칭하는 구조를 고수합니다.
* **Metadata Config**: [src/app/layout.tsx](file:///Users/ryuhojun/Documents/project/health_app/src/app/layout.tsx)의 `<html>` 태그에는 개발 환경의 IDE 확장 등으로 발생할 수 있는 Hydration Mismatch를 막기 위해 `suppressHydrationWarning`을 필수 적용합니다.

### 2) Supabase SSR & Auth (Cookie-based Sessions)
* **Cookie Client Strategy**: `@supabase/ssr`을 사용해 쿠키 세션을 미들웨어를 통해 유지합니다.
* **Core Supabase Config Files**:
  * [src/utils/supabase/client.ts](file:///Users/ryuhojun/Documents/project/health_app/src/utils/supabase/client.ts): Client Component 전용 클라이언트.
  * [src/utils/supabase/server.ts](file:///Users/ryuhojun/Documents/project/health_app/src/utils/supabase/server.ts): Server Component, Route Handler, Server Action 전용 서버사이드 클라이언트.
  * [src/utils/supabase/middleware.ts](file:///Users/ryuhojun/Documents/project/health_app/src/utils/supabase/middleware.ts) & [src/middleware.ts](file:///Users/ryuhojun/Documents/project/health_app/src/middleware.ts): 매 요청마다 Supabase 인증 세션 쿠키를 갱신(Refresh)하고 사용자 유효성을 체크하는 미들웨어.

### 3) Vercel Deployment & Environment Variables
* 배포 시 Vercel Dashboard의 Environment Variables에 다음 환경 변수가 필수 추가되어야 합니다.
  * `NEXT_PUBLIC_SUPABASE_URL`
  * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  * `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (Web Push용 VAPID 공개 키)
  * `VAPID_PRIVATE_KEY` (Web Push용 VAPID 비공개 키)
  * `VAPID_MAILTO` (Web Push용 이메일 주소, 예: `mailto:rhj080471@gmail.com`)
  * `QSTASH_TOKEN` (Upstash QStash API 토큰)
  * `QSTASH_CURRENT_SIGNING_KEY` (QStash 서명 검증 키)
  * `QSTASH_NEXT_SIGNING_KEY` (QStash 서명 검증 키, 롤링 교체용)

### 4) 휴식 타이머 알림 아키텍처 (Supabase DB + Upstash QStash + Web Push)

운동 세트 완료 후 휴식 시간(최대 5분)이 경과하면 앱이 백그라운드에 있어도 PWA 푸시 알림을 수신할 수 있도록 구현된 시스템입니다.

#### 데이터베이스 (Supabase)
* **`push_subscriptions` 테이블**: 유저의 PWA 푸시 구독 정보(`endpoint`, `keys_p256dh`, `keys_auth`)를 영구 저장합니다. RLS 정책으로 본인 구독만 접근 가능합니다.
* **`rest_timers` 테이블**: 타이머 상태(`active` / `cancelled` / `completed`), 발송 예정 시각(`fire_at`), QStash 메시지 ID(`qstash_msg_id`)를 저장합니다. QStash 콜백 시 이 테이블을 조회하여 발송 여부를 결정합니다.

#### 동작 흐름
1. **[클라이언트]** `useRestTimer.start(durationSec)` 호출
2. **[Next.js]** `POST /api/timer/start`: DB에 `active` 레코드 생성 → QStash에 `durationSec`초 후 `/api/push/fire` 호출 예약
3. **[QStash]** N초 대기 후 `/api/push/fire` HTTP 호출
4. **[Next.js]** `POST /api/push/fire`: QStash 서명 검증 → DB 상태 확인 → `active`이면 `web-push` 발송, `cancelled`이면 스킵
5. **[Service Worker]** 푸시 수신 → 기기 알림 표시

#### 타이머 취소 흐름 (건너뛰기)
* **[클라이언트]** `useRestTimer.cancel()` → `POST /api/timer/cancel`: DB `status` → `cancelled`
* QStash가 나중에 콜백해도 DB가 `cancelled`이므로 알림 발송 없이 자동 스킵 (QStash 직접 삭제 불필요)

#### 관련 파일
* [src/providers/PushProvider.tsx](file:///Users/ryuhojun/Documents/project/health_app/src/providers/PushProvider.tsx): 앱 전역 푸시 알림 구독 상태 관리 Context. `layout.tsx`에서 전체를 감쌉니다.
* [src/hooks/useRestTimer.ts](file:///Users/ryuhojun/Documents/project/health_app/src/hooks/useRestTimer.ts): 휴식 타이머 라이프사이클 관리 훅 (시작 / 취소 / 리셋 + 클라이언트 카운트다운).
* [src/app/api/timer/start/route.ts](file:///Users/ryuhojun/Documents/project/health_app/src/app/api/timer/start/route.ts): 타이머 DB 레코드 생성 및 QStash 지연 메시지 예약.
* [src/app/api/timer/cancel/route.ts](file:///Users/ryuhojun/Documents/project/health_app/src/app/api/timer/cancel/route.ts): 타이머 DB 상태를 `cancelled`로 변경.
* [src/app/api/push/fire/route.ts](file:///Users/ryuhojun/Documents/project/health_app/src/app/api/push/fire/route.ts): QStash 콜백 수신, 서명 검증, DB 상태 기반 알림 발송.
* [src/app/api/push/subscribe/route.ts](file:///Users/ryuhojun/Documents/project/health_app/src/app/api/push/subscribe/route.ts): 구독 정보를 Supabase DB에 UPSERT/DELETE.
* [public/sw.js](file:///Users/ryuhojun/Documents/project/health_app/public/sw.js): 푸시 이벤트 수신 및 알림 표시 (Service Worker).
* [public/manifest.json](file:///Users/ryuhojun/Documents/project/health_app/public/manifest.json): PWA 설정 (아이콘, standalone 모드 등).

#### iOS 실기기 사용 방법
1. Vercel 배포 URL을 **Safari**로 접속
2. 공유 버튼 → **"홈 화면에 추가"** 실행
3. 홈 화면 아이콘으로 앱 실행 → 알림 권한 **허용**
4. 이후에는 앱을 완전히 닫아도 백그라운드 알림 수신 가능

---

## 📐 3. Coding & Styling Standards (Strict Rules)

1. **Language & Comments**
   * 모든 소스 코드 내의 주석, 문서 및 커밋 메시지는 **한국어**로만 작성합니다.
2. **Styling Paradigm**
   * Tailwind CSS는 사용하지 않으며, **CSS Module** (`*.module.css`) 기반의 스타일링 방식을 적용합니다.
   * 복잡한 전역 스타일링은 피하고, 개별 컴포넌트에 종속되는 모듈 형식의 스타일링을 지향합니다.
3. **Database RLS & Key Isolation**
   * 외부 공개용 키인 `anon` key는 브라우저 사이드에 노출되어도 괜찮지만, RLS 정책의 통제를 받습니다.
   * `service_role` key는 RLS를 우회(Bypass)하는 슈퍼유저 키이므로 브라우저에 절대 노출되면 안 됩니다.
