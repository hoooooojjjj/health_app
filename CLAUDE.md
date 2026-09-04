# Health App - Technical Guide & Context (AI Agent Instructions)

이 문서는 AI 코딩 에이전트가 세션 진입 시 최우선적으로 로드하는 프로젝트의 핵심 규칙서입니다. 지식 낭비를 막기 위해 상세 설계 문서는 `docs/` 폴더로 분리하여 관리합니다.

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

## 🛠️ 2. Technology Stack & Directory Structure

* **Next.js 16 (App Router)**: 서버 컴포넌트를 기본으로 사용하고 상호작용이 필요한 최소 영역만 클라이언트 컴포넌트로 분리합니다.
* **Supabase SSR & Auth**: 쿠키 세션 기반 사용자 인증 및 RLS 적용.
* **Upstash QStash**: 서버리스 환경의 한계를 극복하는 비동기 지연 큐 관리.
* **Co-location**: 화면 전용 코드는 App Router의 Route Group 및 Private Folder 내부에 배치합니다. 세부 규칙은 `docs/project-structure.md`를 따릅니다.

---

## 📚 3. 에이전틱 지식 베이스 (`docs/`) 연동 지침 (★중요)

프로젝트 고유의 상세한 기능 아키텍처 및 설정은 `docs/` 폴더 하위 문서를 통해 영구 관리됩니다. 에이전트는 아래 지침을 반드시 수행해야 합니다.

1. **지식 획득**: 개발을 시작하기 전, 관련 기능 문서를 읽어 아키텍처와 규칙을 파악합니다.
   * [docs/rest-timer-push.md](file:///Users/ryuhojun/Documents/project/health_app/docs/rest-timer-push.md): 휴식 타이머 & PWA 백그라운드 푸시 알림 아키텍처 가이드.
   * [docs/supabase-auth-rls.md](file:///Users/ryuhojun/Documents/project/health_app/docs/supabase-auth-rls.md): Supabase 인증 미들웨어 및 RLS 설정, 401 오류 가이드.
2. **지식 반영 (Self-Documentation)**: 기능의 수정, API 추가, DB 스키마 변경 등이 완료되면 연관된 `docs/` 문서를 에이전트가 직접 업데이트하여 설계 지식이 코드와 항상 동기화되게 유지합니다.
3. **Spec-First 설계**: 대규모 기능 추가 시 `docs/features/{feature-name}.md` 또는 `PLAN.md`에 설계를 우선 구상한 뒤 사용자의 승인 하에 코드를 변경합니다.

---

## 📐 4. Coding & Styling Standards (Strict Rules)

1. **Language & Comments**: 모든 소스 코드 내의 주석, 문서 및 커밋 메시지는 **한국어**로만 작성합니다.
2. **Styling Paradigm**: Tailwind CSS는 사용하지 않으며, **CSS Module** (`*.module.css`) 기반의 스타일링 방식을 적용합니다.
3. **Database RLS & Key Isolation**: 외부 노출용 키는 `anon` key에 국한하며, `service_role` key는 서버사이드 전용으로 브라우저 노출을 금지합니다.
