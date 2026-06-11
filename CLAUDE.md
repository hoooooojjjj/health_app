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

### 4) Web Push Notifications (PWA)
* **iOS PWA Support**: iOS 환경(iOS 16.4+)에서 백그라운드 푸시 알림을 수신하기 위해서는 반드시 Safari 브라우저에서 **"홈 화면에 추가(Add to Home Screen)"**를 통해 독립된 Standalone 웹앱 형태로 실행해야 합니다. 일반 브라우저 탭 상태에서는 푸시 알림 등록 및 수신이 제한됩니다.
* **Service Worker & PWA Config**:
  * [public/sw.js](file:///Users/ryuhojun/Documents/project/health_app/public/sw.js): 백그라운드 푸시 이벤트(`push`)를 수신하여 기기에 알림을 노출하고, 알림 클릭(`notificationclick`) 시 기존에 열린 웹앱 창을 포커싱하거나 새로운 창을 띄웁니다.
  * [public/manifest.json](file:///Users/ryuhojun/Documents/project/health_app/public/manifest.json): 모바일 환경에서 이 웹 애플리케이션을 단독 앱(PWA) 스타일로 인식하도록 아이콘, 테마 색상, 실행 모드(`standalone`) 등을 선언합니다.
* **Push Notification APIs**:
  * [src/app/api/push/subscribe/route.ts](file:///Users/ryuhojun/Documents/project/health_app/src/app/api/push/subscribe/route.ts): 브라우저(서비스 워커)에서 발급받은 알림 구독 객체(PushSubscription)를 수신하여 메모리 또는 데이터베이스에 저장/갱신/삭제합니다.
  * [src/app/api/push/send/route.ts](file:///Users/ryuhojun/Documents/project/health_app/src/app/api/push/send/route.ts): 저장된 구독 객체로 웹 푸시 알림을 발송합니다. 타이머 지연 발송(`delaySeconds`) 기능을 제공하며, 서버리스 함수 실행 제한 시간을 위해 `maxDuration = 60`(초)이 설정되어 있습니다.

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
