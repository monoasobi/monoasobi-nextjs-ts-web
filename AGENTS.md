---
description: 
alwaysApply: true
---

# Repository Guidelines

## 프로젝트 구조 및 모듈 구성
이 저장소는 Vite, React, TypeScript 기반 웹 앱입니다. 앱 코드는 `src/` 아래에 둡니다.

- `src/pages/`: 라우트 단위 페이지 컴포넌트입니다. 예: `Home.page.tsx`.
- `src/components/`: 재사용 UI와 리더 컴포넌트입니다. `common`, `custom`, `layout` 하위 폴더를 기존 용도에 맞게 사용합니다.
- `src/atoms/`: Recoil atom 상태를 관리합니다.
- `src/hooks/`: 재사용 React hook을 둡니다. 예: `useHandleClickOutside.ts`.
- `src/lib/`: 도메인 데이터와 유틸성 로직, lyrics 관련 파일을 둡니다.
- `src/types/`: 프로젝트 타입 선언 파일을 둡니다.
- `src/utils/`: 라우터, 스토리지 등 공통 유틸리티를 둡니다.
- `src/assets/`: 코드에서 import하는 이미지와 SVG를 둡니다.
- `public/`: favicon, manifest, Open Graph 이미지처럼 그대로 서빙되는 정적 파일을 둡니다.

`tsconfig.app.json`의 alias를 우선 사용합니다. 긴 상대 경로 대신 `@components/*`, `@pages/*`, `@assets/*`, `@lib/*` 등을 사용하세요.

## 빌드, 테스트, 개발 명령
주요 명령은 `package.json`의 npm script를 사용합니다.

- `npm run dev`: Vite 개발 서버를 실행합니다.
- `npm run build`: TypeScript 빌드 검사를 수행하고 production 빌드를 생성합니다.
- `npm run lint`: ESLint로 전체 코드를 검사합니다.
- `npm run preview`: production 빌드를 로컬에서 확인합니다.

의존성 변경 후에는 `npm install`을 실행하세요. `package-lock.json`이 있으므로 패키지 매니저는 npm을 유지합니다.

## 코딩 스타일 및 네이밍 규칙
React 컴포넌트는 TypeScript와 `.tsx`를 사용합니다. 기존 패턴을 따르세요: 페이지는 `Name.page.tsx`, hook은 `use` 접두사, atom은 `.atom.ts`, 타입 선언은 `.d.ts`를 사용합니다.

TypeScript는 strict 설정이며, ESLint 9, `typescript-eslint`, `react-hooks`, `react-refresh` 규칙을 사용합니다. 사용하지 않는 import, 지역 변수, 파라미터를 남기지 말고 PR 전 `npm run lint`를 실행하세요.

## 테스트 지침
현재 별도 테스트 러너와 `npm test` script는 없습니다. 변경 사항은 `npm run lint`, `npm run build`, `npm run dev` 또는 `npm run preview`에서의 수동 확인으로 검증합니다.

추후 테스트를 추가한다면 관련 소스 근처에 배치하거나 공통 테스트 헬퍼용 디렉터리를 명확히 만드세요. 테스트 파일명은 원본 파일을 반영해 `ComicReader.test.tsx`처럼 작성합니다.

## 커밋 및 Pull Request 지침
최근 커밋은 `사이드바 레이아웃 개선`, `배송조회 바로가기 업데이트`처럼 짧고 직접적인 한국어 요약을 사용합니다. 커밋은 한 가지 변경에 집중하고 간결하게 작성하세요.
커밋 메시지는 한국어로 간단히 작성하고, 제목과 본문을 포함해 3줄 이내로 제한하세요.

PR에는 변경 요약, 관련 이슈 또는 작업 링크, UI 변경 시 스크린샷, 검증에 사용한 명령을 포함합니다. 환경 변수나 배포 설정에 영향이 있으면 별도로 명시하세요.

## 보안 및 설정 팁
`.env`의 비밀값은 커밋하지 않습니다. 코드에서 import할 앱 자산은 `src/assets/`, 직접 서빙할 정적 파일은 `public/`에 둡니다. 배포 설정은 `vercel.json`, Vite public 디렉터리 설정은 `vite.config.ts`에서 관리합니다.
