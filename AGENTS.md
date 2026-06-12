<!-- BEGIN:nextjs-agent-rules -->
# 🤖 AI Agent Coding Rules (MUST ALWAYS FOLLOW)

## 1. Next.js App Router Context
This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## 2. 📚 Self-Documentation (중요)
프로젝트 고유의 상세한 기능 아키텍처 및 설정은 `docs/` 폴더 하위 문서를 통해 영구 관리됩니다. 에이전트는 아래 지침을 반드시 수행해야 합니다.

1. **지식 획득**: 개발을 시작하기 전, 관련 기능 문서를 읽어 아키텍처와 규칙을 파악합니다.
   * [docs/rest-timer-push.md](file:///Users/ryuhojun/Documents/project/health_app/docs/rest-timer-push.md): 휴식 타이머 & PWA 백그라운드 푸시 알림 아키텍처 가이드.
   * [docs/supabase-auth-rls.md](file:///Users/ryuhojun/Documents/project/health_app/docs/supabase-auth-rls.md): Supabase 인증 미들웨어 및 RLS 설정, 401 오류 가이드.
2. **지식 반영 (Self-Documentation)**: 기능의 추가, 수정, API 추가, DB 스키마 변경 등이 완료되면 연관된 `docs/` 문서를 에이전트가 직접 생성하여 작성하거나 기존 작업을 수정한다면 기존 문서를 업데이트하여 설계 지식이 코드와 항상 동기화되게 유지합니다.
3. **Spec-First 설계**: 대규모 기능 추가 시 `docs/features/{feature-name}.md` 또는 `PLAN.md`에 설계를 우선 구상한 뒤 사용자의 승인 하에 코드를 변경합니다.

## 3. 🌐 Language & Communication
- 모든 주석, 문서 수정, 그리고 사용자 답변은 **한국어**로만 작성합니다.

## 4. 🚫 No Auto Git Commits
- 사용자가 명시적으로 지시하거나 승인하기 전에는 자동으로 `git commit`을 실행하지 마십시오.
<!-- END:nextjs-agent-rules -->
