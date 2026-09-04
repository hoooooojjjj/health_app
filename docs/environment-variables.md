# 환경변수 설정 가이드

프로젝트 루트의 `.env`에 로컬 개발 환경변수를 설정합니다. 더 높은 우선순위의 개인 설정이 필요하면 `.env.local`을 사용할 수 있습니다. 두 파일은 모두 Git 추적에서 제외됩니다.

## 필수 변수

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 브라우저에서 사용하는 공개용 익명 키
- `SUPABASE_SERVICE_ROLE_KEY`: RLS를 우회하는 서버 전용 관리자 키

`SUPABASE_SERVICE_ROLE_KEY`는 브라우저 코드에 사용하거나 `NEXT_PUBLIC_` 접두사를 붙이면 안 됩니다.

### Web Push

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: 브라우저 푸시 구독용 공개키
- `VAPID_PRIVATE_KEY`: 서버의 푸시 발송용 비밀키
- `VAPID_MAILTO`: VAPID 관리자 연락처이며 `mailto:name@example.com` 형식을 사용

VAPID 키 쌍은 다음 명령으로 생성할 수 있습니다.

```bash
npx web-push generate-vapid-keys
```

### Upstash QStash

- `QSTASH_TOKEN`: 지연 메시지 발행 토큰
- `QSTASH_CURRENT_SIGNING_KEY`: 현재 콜백 서명 검증 키
- `QSTASH_NEXT_SIGNING_KEY`: 키 교체 과정에서 사용할 다음 서명 검증 키
- `QSTASH_URL`: QStash API 주소. 기본값은 `https://qstash.upstash.io`

QStash는 외부에서 접근할 수 없는 `localhost`로 콜백할 수 없으므로 로컬 실행에서는 예약 발송이 생략됩니다.

## 환경별 변수

- `NEXT_PUBLIC_APP_URL`: 로컬에서는 `http://localhost:3000`, 배포 환경에서는 실제 HTTPS 주소
- `ANTHROPIC_API_KEY`: `scripts/seed-exercises.js`를 실행할 때만 필요한 AI 번역용 키

`VERCEL_URL`은 Vercel 배포 환경이 자동으로 주입합니다. 로컬 `.env`에 직접 선언하지 않습니다.

## 로딩 규칙

Next.js는 프로젝트 루트의 `.env` 계열 파일을 자동으로 읽으며 `.env.local`이 `.env`보다 우선합니다. `NEXT_PUBLIC_` 변수는 빌드 시 브라우저 번들에 포함되므로 공개 가능한 값만 사용해야 합니다.

운동 데이터 관련 Node.js 스크립트도 같은 순서로 `.env.local`과 `.env`를 읽습니다.
