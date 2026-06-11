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
