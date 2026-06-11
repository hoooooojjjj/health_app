# Health App 개발 가이드 (Next.js + Supabase SSR)

이 문서는 프로젝트의 빌드/실행 명령어, 파일 구조 및 개발 시 준수해야 할 코딩 규칙을 정리한 **실무 지침서**입니다. 
*프로젝트의 비즈니스 배경지식, 기획 의도 및 아키텍처 다이어그램은 [README.md](file:///Users/ryuhojun/Documents/project/health_app/README.md)에서 확인하실 수 있습니다.*

AI 코딩 에이전트(Antigravity 등)가 작업을 진행할 때 이 문서의 규칙을 최우선으로 참고합니다.

---

## 🚀 실행 및 빌드 명령어

* **로컬 개발 서버 실행:**
  ```bash
  npm run dev
  ```
* **프로젝트 빌드 테스트 (Production Dry-run):**
  ```bash
  npm run build
  ```
* **린트 검사:**
  ```bash
  npm run lint
  ```

---

## 📂 Supabase SSR 아키텍처 및 파일 구조

프로젝트는 서버사이드 렌더링(SSR) 환경에서 안전하게 Supabase API를 요청하고 쿠키 기반 세션을 유지할 수 있도록 설계되었습니다.

* **[.env.local](file:///Users/ryuhojun/Documents/project/health_app/.env.local)**
  * Supabase 연결용 환경 변수 설정 파일입니다. (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
* **[src/utils/supabase/server.ts](file:///Users/ryuhojun/Documents/project/health_app/src/utils/supabase/server.ts)**
  * Server Component, Route Handler(API), Server Action에서 호출하는 서버사이드 Supabase 클라이언트 유틸리티입니다. 비동기 쿠키 처리가 적용되어 있습니다.
* **[src/utils/supabase/client.ts](file:///Users/ryuhojun/Documents/project/health_app/src/utils/supabase/client.ts)**
  * Client Component(브라우저)에서 Supabase API를 직접 호출할 때 사용하는 클라이언트 유틸리티입니다.
* **[src/utils/supabase/middleware.ts](file:///Users/ryuhojun/Documents/project/health_app/src/utils/supabase/middleware.ts)** & **[src/middleware.ts](file:///Users/ryuhojun/Documents/project/health_app/src/middleware.ts)**
  * 사용자의 로그인 세션 토큰을 매 요청마다 자동으로 검증 및 갱신(Refresh)하여 쿠키에 세션을 유지해주는 Next.js 미들웨어 설정입니다.

---

## 🛠️ 개발 규칙 (Coding Standards)

AI 에이전트와 협업하거나 직접 코드를 작성할 때 다음 규칙을 준수해야 합니다.

1. **주석 및 커밋 메시지**
   * 모든 소스 코드 내 주석과 Git 커밋 메시지는 반드시 **한국어**로 작성합니다.
2. **스타일링 (Styling)**
   * Tailwind CSS 대신, 일반 CSS 및 **CSS Module**(`*.module.css`) 방식을 사용합니다.
   * 스타일은 인라인 스타일 대신 별도의 CSS 모듈 파일로 분리하여 컴포넌트 내부에서 임포트해 적용합니다.
3. **Hydration Warning 방지**
   * 개발 환경의 브라우저 확장 프로그램 및 IDE 도구(Cursor 등)의 속성 삽입으로 인한 오류를 예방하기 위해, [src/app/layout.tsx](file:///Users/ryuhojun/Documents/project/health_app/src/app/layout.tsx)의 `<html>` 태그에는 항상 `suppressHydrationWarning`을 유지합니다.
4. **서버 사이드 API 호출 규칙**
   * 클라이언트 측에서 불필요하게 API 키 노출이나 오버헤드가 발생하는 것을 방지하기 위해, 가능한 서버 컴포넌트(`Server Component`)나 API 라우트(`Route Handler`) 단에서 `src/utils/supabase/server.ts` 클라이언트를 사용하여 데이터 조회를 수행합니다.
