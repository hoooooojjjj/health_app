# 공통 하단 내비게이션

## 개요

인증 후 사용하는 주요 화면은 공통 `AppLayout`과 하단 `Footer`를 공유합니다. 푸터는 루트 레이아웃에 포함하지 않고 `(main)` Route Group의 중첩 레이아웃에서만 조합합니다. 이 구조를 통해 주요 화면에는 일관된 하단 탭을 제공하고 로그인이나 전체 화면 플로우에서는 푸터를 제외할 수 있습니다.

## 구성 요소

- `src/components/AppLayout/AppLayout.tsx`: 최대 너비, 전체 화면 높이, 콘텐츠와 선택적 푸터 영역을 구성하는 공통 화면 셸
- `src/components/Footer/Footer.tsx`: 현재 경로를 판별하고 접근 가능한 하단 내비게이션을 렌더링하는 클라이언트 컴포넌트
- `src/components/Footer/navigation.ts`: 탭의 경로, 이름, 아이콘, 경로 일치 방식을 선언하는 설정
- `src/components/Footer/icons.tsx`: 푸터에서 사용하는 아이콘
- `src/app/(main)/layout.tsx`: `(main)` 아래 모든 페이지에 `AppLayout`과 `Footer`를 적용하는 서버 레이아웃

## 탭 추가 방법

`FOOTER_NAVIGATION_ITEMS`에 항목을 추가합니다. `match`가 `exact`이면 경로가 완전히 같을 때만 활성화되고, `prefix`이면 하위 경로에서도 활성화됩니다. 탭 렌더링 코드는 수정하지 않습니다.

```ts
{
  href: '/profile',
  label: '프로필',
  icon: ProfileIcon,
  match: 'prefix',
}
```

## 푸터 포함 및 제외

- 푸터가 필요한 페이지는 `src/app/(main)` 아래에 둡니다.
- 로그인처럼 푸터가 없어야 하는 페이지는 `(auth)`처럼 `(main)` 밖의 Route Group에 둡니다.
- 공통 최대 너비와 화면 배경만 필요할 때는 `AppLayout`에 `footer`를 전달하지 않고 직접 사용합니다.

Route Group은 URL에 포함되지 않으므로 `/routine` 주소는 폴더 구조와 관계없이 그대로 유지됩니다. 루트 레이아웃은 Provider와 전역 문서 구조만 담당하며 특정 화면의 내비게이션 정책을 알지 않습니다.
