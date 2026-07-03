<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 프로젝트 작업 지침

## 기본 커뮤니케이션

- 항상 한국어로 답변합니다.
- 존댓말을 사용합니다.
- 직접 코드를 수정한 경우 변경사항은 최대한 간략하게 설명합니다.

## 프로젝트 개요

- 이 프로젝트는 YOASOBI의 노래와 연결된 원작 소설, 만화, 가사 콘텐츠를 감상하는 MONOASOBI 웹 앱입니다.
- Next.js 16 App Router, React 19, TypeScript를 사용합니다.
- UI는 Radix UI Themes와 CSS Modules 중심으로 구성합니다.
- 전역 UI 상태는 Jotai atom을 사용합니다.
- DB는 Turso와 Drizzle ORM을 사용합니다.
- 소설 Markdown과 만화 이미지는 Cloudflare R2에 저장하고, 앱 API를 통해 제공합니다.
- 관리자 화면은 음악, 소설, 만화, 가사 트랙, 서적 데이터를 관리합니다.
- Agent API는 외부 프로젝트에서 catalog를 읽기 위한 읽기 전용 API입니다.

## 주요 디렉터리 역할

- `src/app`: Next.js App Router 라우트, route 전용 컴포넌트, API route를 둡니다.
- `src/app/**/_components`: 특정 route에서만 쓰는 컴포넌트를 둡니다.
- `src/components`: 여러 route에서 재사용 가능한 공용 UI나 도메인 표시 컴포넌트를 둡니다.
- `src/components/common`: 영상, 가사 플레이어 등 공용 기능 UI를 둡니다.
- `src/components/content`: 소설, 만화, 구매 링크, 번역 안내 등 콘텐츠 표시 UI를 둡니다.
- `src/components/custom`: 홈, 가이드, 특수 페이지용 UI를 둡니다.
- `src/components/layout`: 앱 프레임, 헤더, 사이드바 등 레이아웃 UI를 둡니다.
- `src/components/feedback`: 로딩, 에러 같은 피드백 UI를 둡니다.
- `src/server`: 서버 전용 인증, DB, query, mutation, storage 로직을 둡니다.
- `src/server/queries`: 조회 로직을 둡니다.
- `src/server/mutations`: 쓰기 로직을 둡니다.
- `src/server/schemas`: 서버 입력 검증 스키마를 둡니다.
- `src/server/auth`: 권한별 인증 로직을 둡니다.
- `src/types`: 도메인 타입 선언을 둡니다.
- `src/atoms`: Jotai atom을 둡니다.
- `public/images`: 정적 이미지와 앨범아트를 둡니다.

## 파일명 규칙

- React 컴포넌트 파일은 `PascalCase.tsx`를 사용합니다.
  - 예: `AdminDocumentPanel.tsx`, `TimelineCanvas.tsx`
- 컴포넌트별 CSS Module은 컴포넌트명과 맞춰 `PascalCase.module.css`를 사용합니다.
  - 예: `Sidebar.module.css`, `LyricTimelineEditor.module.css`
- route 전용 보조 CSS처럼 기존 파일명이 이미 kebab-case인 경우에는 기존 주변 컨벤션을 따릅니다.
  - 예: `route-shell.module.css`
- hook 파일은 `useSomething.ts` 형식을 사용합니다.
  - 예: `useTimelineResize.ts`, `useTimelineZoom.ts`
- 순수 유틸 파일은 역할이 드러나는 camelCase 또는 짧은 명사형을 사용합니다.
  - 예: `timelineUtils.ts`, `time.ts`, `metadata.ts`
- 서버 query/mutation 파일은 도메인 단수명 또는 기능명이 드러나는 이름을 사용합니다.
  - 예: `music.ts`, `novel.ts`, `admin.ts`
- 타입 선언 파일은 도메인명 기반 `*.d.ts`를 사용합니다.
  - 예: `music.d.ts`, `lyric.d.ts`
- API route 파일명은 Next.js 규칙에 따라 `route.ts`를 사용합니다.
- Next.js page/layout/not-found 파일은 프레임워크 규칙에 따라 `page.tsx`, `layout.tsx`, `not-found.tsx`를 사용합니다.

## 코드 구조와 파일 분리

- 새 컴포넌트를 만들거나 기존 컴포넌트를 확장하기 전에 코드 스플릿을 먼저 고려합니다.
- 단일 컴포넌트 파일이 과도하게 커지지 않도록 관리합니다.
- UI 렌더링, hooks, 유틸, 타입, payload 변환, config 로직이 섞이기 시작하면 역할별 파일로 분리합니다.
- 주체가 되는 컴포넌트 파일은 상위 폴더에 둡니다.
- 주체 컴포넌트의 보조 파일은 주체 컴포넌트와 같은 이름의 폴더 아래에 둡니다.

예시:

```txt
src/app/admin/_components/
  AdminDocumentPanel.tsx
  AdminDocumentPanel/
    AdminEditorForm.tsx
    AdminEditorField.tsx
    adminEditorConfig.ts
    adminSelectedDocument.ts
    types.ts
    utils.ts
```

- 특정 route의 상태, 데이터 조립, 권한, navigation, API 흐름에 묶인 컴포넌트는 `src/app/**/_components`에 둡니다.
- 여러 route에서 재사용 가능하거나 도메인 표시 단위로 독립적인 컴포넌트는 `src/components`에 둡니다.
- 상호작용 로직은 가능하면 focused hook으로 분리합니다.
- 순수 계산, 변환, format 함수는 utility 파일로 분리합니다.
- config가 도메인별로 길어지는 경우 도메인별 파일로 나눕니다.
- 파일 분리는 코드 양을 줄이기 위한 목적뿐 아니라 읽기 쉬운 책임 경계를 만들기 위한 목적입니다.

## UI 작성 기준

- Radix UI Themes 컴포넌트를 최대한 활용합니다.
- Radix UI가 제공하는 props를 기본 스타일링 수단으로 먼저 사용합니다.
  - 예: `size`, `variant`, `color`, `gap`, `align`, `justify`, `direction`, `wrap`, `p`, `px`, `py`, `m`, `width`
- Radix UI props로 표현할 수 없는 레이아웃, 상태, 반응형, 복합 스타일만 CSS Module에 작성합니다.
- 단순 간격, 정렬, 색상, 버튼 스타일을 위해 불필요한 CSS class를 추가하지 않습니다.
- 기존 CSS Module을 수정할 때도 Radix props로 대체 가능한 스타일인지 먼저 확인합니다.

## App Router 작업 주의

- 이 프로젝트의 Next.js는 일반적으로 알고 있는 버전과 다를 수 있습니다.
- Next.js API, file convention, deprecation이 확실하지 않으면 `node_modules/next/dist/docs/`의 관련 문서를 먼저 읽습니다.
- Server Component와 Client Component 경계를 의식합니다.
- `useState`, `useEffect`, browser API, event handler가 필요한 컴포넌트에는 `"use client"`가 필요합니다.
- 서버 전용 로직은 client component로 가져오지 않습니다.

## 검증

- 이 환경에서 일상적인 검증 용도로 `npm run build`를 실행하지 않습니다.
- 기본 검증 명령은 `npm run lint`입니다.
- 빌드 확인이 꼭 필요한 경우에는 사용자에게 먼저 확인합니다.
- 사용자가 브라우저에서 직접 동작 확인을 했다고 말한 경우에도, 코드 변경 후에는 가능한 한 `npm run lint`로 정적 검증을 수행합니다.

## 커밋

- 커밋 메시지는 한글로 간결하게 작성합니다.
- 보통 1~2줄 이내로 작성합니다.
- 한 커밋에는 관련 있는 변경만 포함합니다.
- 사용자가 만든 것으로 보이는 무관한 변경은 커밋에 포함하지 않습니다.
- 커밋 전에는 `git status --short`와 staged diff를 확인합니다.
