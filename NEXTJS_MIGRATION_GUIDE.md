# Next.js Migration Guide

## 목적
현재 Vite React 앱을 Next.js 기반으로 이전하면서, 데이터 관리와 에이전트용 읽기 API를 정리한다. React에서 Next.js로 이전하는 것을 제외하고 기존 스택과 구현 방식을 최대한 유지한다.

## 프로젝트 구조 오버뷰
현재 프로젝트는 Vite React SPA와 별도 Cloudflare Worker 저장소로 나뉘어 있다. React 앱은 화면과 정적 데이터를 담당하고, Worker는 R2/KV 기반 콘텐츠 API를 담당한다. 마이그레이션 후에는 Next.js 저장소 안에서 페이지, API, DB 접근, R2 접근을 함께 관리하되, 기존 코드 작성 스타일은 유지한다.

현재 구조:
```txt
monoasobi-react-ts-web
  src/pages              라우트 단위 화면
  src/components         재사용 UI, 리더, 특수 콘텐츠
  src/components/layout  Header, Sidebar, ContentsContainer
  src/components/common  가사/영상 등 공통 기능
  src/components/custom  heartbeat, onthestage, players 특수 화면
  src/atoms              Jotai 전역 상태
  src/lib                music, novel, comic, book 정적 데이터
  src/lib/lyrics         곡별 가사 JSON
  src/types              도메인 타입
  src/utils              라우터, storage effect, 파일 유틸

monoasobi-workers
  /novel/:id             R2 Markdown 제공
  /comic/:id             R2 만화 이미지 목록 제공
  /comic-file/:key       R2 만화 이미지 프록시
  /auth                  제한 콘텐츠 접근 인증
  /orders                KV 주문 조회
```

목표 구조:
```txt
Next.js app
  app/
    layout.tsx                 Root layout, providers
    page.tsx                   Home
    novel/[id]/page.tsx        소설 상세
    comic/[id]/page.tsx        만화 상세
    heartbeat/page.tsx         특수 페이지
    onthestage/page.tsx        특수 페이지
    players/page.tsx           특수 페이지
    private-reader/page.tsx    제한 콘텐츠 접근 로그인
    /page.tsx             사이트 관리자 화면
    admin/_components/         관리자 화면 전용 컴포넌트
    api/content/               소설/만화 콘텐츠 API
    api/agent/                 다른 Codex 프로젝트용 읽기 API
    api/admin/                 사이트 관리자용 DB 관리 API

  components/
    layout/                    Header, Sidebar, ContentsContainer
    common/                    가사/영상 등 공통 기능
    custom/                    특수 콘텐츠 UI

  server/
    db/                        Turso + Drizzle client, schema, migrations
    storage/                   Cloudflare R2 접근
    auth/                      private-reader, admin, agent 인증
    queries/                   페이지/API/metadata가 공유하는 조회 함수
    mutations/                 사이트 관리자 쓰기 작업
    schemas/                   Zod 기반 관리자 입력 검증
    seed/                      기존 lib 데이터 seed

  atoms 또는 store/             Jotai 전역 상태
  types/                       도메인 타입
  utils/                       공통 유틸
  styles/                      전역 스타일
  public/                      favicon, manifest, opengraph 이미지
```

주요 경계:
- 페이지 UI는 기존처럼 얇은 page와 `components/*` 조합으로 유지한다.
- `src/lib` 정적 데이터는 Turso DB와 seed로 이전한다.
- R2는 public bucket으로 열지 않고 Next.js API에서 프록시한다.
- 기존 `admin` 의미는 `private-reader`로 옮기고, 새 `admin`은 사이트 관리자 권한으로만 사용한다.
- 다른 Codex 프로젝트는 MCP가 아니라 `/api/agent/*` HTTP API만 사용한다.
- 주문 조회는 임시 기능이므로 Next.js 마이그레이션 과정에서 제거한다. 필요 시 별도 DB/API로 새로 구현한다.

## 기본 원칙
- 마이그레이션은 반드시 별도 브랜치에서 진행한다. 예: `migration_nextjs`
- 한 번에 크게 갈아엎지 않고, 작은 단계로 나누어 Codex와 작업한다.
- 각 단계가 끝날 때 결정권자가 변경사항을 확인하고 다음 단계 진행 여부를 판단한다.
- 기존 UI, 라우팅 동작, 스타일, 데이터 구조는 가능한 한 보존한다.
- 기존 Cloudflare 서버리스 의존은 줄이되, Cloudflare R2 객체 저장소는 우선 유지한다.
- 다른 Codex 프로젝트는 MCP가 아니라 별도 HTTP API만 사용한다.
- Recoil은 React 19/Next.js 16 환경에서 런타임 호환 문제가 발생하므로, 본격적인 Next.js 화면 이식 전에 원본 Vite 앱에서 먼저 Jotai로 전환한다.
- React Compiler는 최종적으로 사용한다. 단, 마이그레이션 중 원인 분리를 쉽게 하기 위해 초기 Next.js 이전 단계에서는 끄고, Next.js 이전과 Jotai 전환이 안정화된 뒤 별도 sub task로 켠다.
- 제한 콘텐츠 열람 권한, DB 수정 관리자 권한, Agent API 접근 권한은 서로 다른 권한으로 취급한다.
- 기존 코드에서 `admin`으로 부르던 개념은 사이트 관리자가 아니라 제한 콘텐츠 접근 가능자를 뜻한다. 마이그레이션 후에는 `private-reader`로 재명명한다.
- `admin`은 마이그레이션 후 신설되는 사이트 관리자 권한으로만 사용한다.
- 기존 Worker 저장소가 private였던 이유를 유지한다. secret, 인증 로직, 주문/관리 API가 포함되는 Next.js 저장소도 private 운영을 기본 전제로 한다.

## 코드 스타일 보존 대전제
마이그레이션 작업자는 새 구조를 도입하기 전에 반드시 기존 구현을 먼저 읽고, 현재 저장소의 코드 작성 방식과 파일 분리 방식을 우선한다. Next.js 도입은 런타임과 라우팅 기반을 바꾸는 작업이지, 코드 스타일을 새로 정의하는 작업이 아니다.

작업 전 확인 규칙:
- 각 단계 시작 전에 main 브랜치 또는 마이그레이션 시작 시점의 기존 구현을 먼저 살펴본다.
- 관련 페이지, 컴포넌트, atom, lib 데이터, 타입, util을 읽고 현재 패턴을 파악한 뒤 작업한다.
- 기존 구현과 다른 구조가 필요하면 먼저 이유와 대안을 설명하고 결정권자의 판단을 받는다.
- 관련 없는 리팩터링, 폴더 재구성, 디자인 시스템 재정의는 하지 않는다.

보존할 작성 스타일:
- 역할별 폴더 구조를 우선 유지한다. 예: `pages`, `components`, `components/layout`, `components/common`, `components/custom`, `atoms`, `lib`, `types`, `utils`.
- 페이지 컴포넌트는 라우팅, 데이터 조회, 접근 분기만 담당하고 실제 UI는 `components/*`에 위임한다.
- Next.js로 전환하는 UI는 원본 코드의 컴포넌트 구성과 라이브러리 사용을 최대한 유지한다. 특히 Radix UI 컴포넌트(`ScrollArea`, `Flex`, `Text`, `Badge`, `Popover`, `SegmentedControl` 등)는 원본에서 사용 중이면 그대로 옮기는 것을 기본값으로 한다.
- CSS Modules 전환 대상은 주로 `styled-components`로 작성된 예외적인 스타일 레이어다. 라우터, 상태관리, Server/Client Component 경계 때문에 필요한 변경 외에는 기존 JSX 구조와 Radix 컴포넌트 사용을 임의로 단순화하지 않는다.
- Next.js로 새로 작성하거나 원본에 없는 UI를 추가할 때는 Radix UI와 CSS Modules 조합을 기본으로 한다.
- 화면 전용 스타일은 해당 컴포넌트 또는 route 가까이에 `*.module.css`로 둔다.
- CSS Modules 파일이 커지면 역할별 class를 정리하되, 별도 런타임 스타일 라이브러리를 새로 늘리지 않는다.
- 기존 `styled-components` 코드는 legacy로 취급한다. 화면 복원을 빠르게 하기 위해 임시 이식은 허용하지만, 새 코드에는 추가하지 않고 단계적으로 CSS Modules로 전환한다.
- 기존 alias import를 유지한다. 예: `@components/*`, `@lib/*`, `@atoms/*`, `@appTypes/*`.
- 도메인 타입은 `src/types`의 기존 모델링 방식을 존중한다. 특히 `Novel`처럼 상태 조합이 중요한 타입은 DB 전환 후에도 명확히 표현한다.
- 브라우저 API를 쓰는 컴포넌트는 Next.js에서 명확히 client component로 분리한다.
- 기존 `admin` 명명은 새 사이트 관리자 기능을 만들기 전에 `privateReader` 계열로 먼저 정리한다.

Next.js server/client component 기준:
- `app/**/page.tsx`는 가능하면 Server Component로 유지한다.
- `page.tsx`는 params 처리, 서버 query, `notFound`, redirect, `generateMetadata`를 담당한다.
- `useState`, `useEffect`, localStorage, sessionStorage, event handler, Jotai가 필요한 UI는 별도 Client Component로 분리한다.
- route 전용 Client Component는 해당 route 아래 `_components/`에 둔다. 예: `app/novel/[id]/_components/NovelPageClient.tsx`.
- 여러 페이지에서 재사용되는 UI는 기존처럼 top-level `components/*`에 둔다.
- `generateMetadata`가 필요한 라우트의 `page.tsx`에는 `"use client"`를 붙이지 않는다.
- 소설/만화처럼 페이지별 metadata가 필요한 라우트는 `page.tsx`에서 `generateMetadata`를 export하고, 실제 UI는 Client Component로 위임한다.
- CSS Modules는 Server Component와 Client Component 양쪽에서 사용할 수 있으므로, 단순 스타일 때문에 Client Component 경계를 늘리지 않는다.
- 기존 `styled-components`를 임시 이식하는 경우 해당 컴포넌트는 Client Component 경계 안에 둔다.

## 데이터 및 스토리지 아키텍처
```txt
Turso + Drizzle
  musics
  novels
  comics
  books
  book_novels
  book_purchase_links
  lyric_tracks

Cloudflare R2
  novel/{id}.md
  comics/{comicId}/{page}.jpg
  images/books/{bookId}.jpg
```

## 예상 의존성
기존 스택은 최대한 유지하되, DB/검증/어드민 폼 구현을 위해 필요한 패키지를 추가한다. 실제 설치 전에는 최신 버전과 Next.js 호환성을 확인한다.

추가 후보:
```txt
next
drizzle-orm
drizzle-kit
@libsql/client
zod
react-hook-form
@hookform/resolvers
@aws-sdk/client-s3
jotai
```

기존 유지 후보:
```txt
react
react-dom
@radix-ui/themes
@heroicons/react
react-markdown
remark-breaks
@vercel/analytics
```

전환 후 제거 후보:
```txt
vite
@vitejs/plugin-react
vite-tsconfig-paths
react-router-dom
recoil
styled-components
```

주의:
- `recoil`은 Jotai 선행 전환 완료 후 제거하며, Next.js 마이그레이션 중 임시 유지하지 않는다.
- `react-router-dom`은 App Router 이전 완료 후 제거한다.
- `styled-components`는 기존 UI 임시 이식을 위해 남길 수 있으나, 최종적으로 CSS Modules 전환 완료 후 제거한다.
- R2 연동은 S3 호환 API를 쓰므로 AWS SDK 또는 동등한 S3 호환 클라이언트를 사용한다.
- React Compiler는 Next.js 16에서 stable 지원이지만 기본 활성화가 아니므로, 초기 골격 생성 시에는 끄고 최종 안정화 후 `reactCompiler: true`로 전환한다.

## 환경변수 체크리스트
실제 secret 값은 문서, 코드, `AGENTS.md`, README에 기록하지 않는다. 배포 환경변수와 로컬 `.env`에서만 관리한다.

```txt
TURSO_DATABASE_URL
TURSO_AUTH_TOKEN

R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME

PRIVATE_READER_TOKEN 또는 PRIVATE_READER_PASSWORD
ADMIN_PASSWORD
ADMIN_SESSION_SECRET
AGENT_API_TOKEN
```

원칙:
- 기존 Worker의 `ADMIN` 값은 `PRIVATE_READER_*` 계열로 재명명하고 rotation한다.
- 사이트 관리자용 secret은 `ADMIN_*` 계열로 분리한다.
- Agent API token은 사이트 관리자 세션이나 private-reader 권한과 대체할 수 없다.
- 환경변수 이름은 구현 중 더 명확한 이름이 필요하면 변경할 수 있으나, 세 권한의 분리는 유지한다.

## 0단계: 브랜치 준비
1. 현재 작업 트리를 확인한다.
2. 미커밋 변경사항이 있으면 사용자가 처리 방향을 결정한다.
3. 새 브랜치를 만든다.

```sh
git checkout -b migration_nextjs
```

완료 기준:
- `migration_nextjs` 브랜치에서 작업 중이다.
- 기존 앱이 변경 전 상태에서 정상 빌드되는지 확인했다.

## 1단계: 현재 앱 동작 기준선 기록
Next.js 이전 전에 기존 동작을 기록한다.

확인 항목:
- 홈 화면
- 사이드바 음악 목록
- 소설 페이지
- 정식 출판 소설 구매 안내
- 만화 페이지
- 특수 페이지: `heartbeat`, `onthestage`, `players`
- 가사 플레이어
- 기존 `admin` 상태로 처리되던 제한 콘텐츠 열람 동작

완료 기준:
- 주요 URL 목록과 현재 동작을 문서화했다.
- 이후 마이그레이션에서 비교할 기준이 생겼다.

## 2단계: Next.js 프로젝트 골격 도입
목표는 기능 변경 없이 실행 기반만 Next.js로 바꾸는 것이다.

작업 방식:
- 기존 Vite 루트에 Next.js를 바로 덧씌우지 않는다.
- 현재 프로젝트 루트 하위에 Next.js 마이그레이션 작업 폴더를 만든다. 예: `nextjs-migration/`.
- `nextjs-migration/` 안에서 `create-next-app`으로 Next.js 템플릿을 생성한다.
- 이 폴더는 작업 추적이 필요하므로 `.gitignore`에 추가하지 않는다.
- 실제 Next.js 마이그레이션 작업은 `nextjs-migration/` 하위 폴더 안에서 진행한다.
- 기존 Vite 루트는 원본으로 유지하고, `nextjs-migration/` 작업 중 상위 폴더의 기존 코드를 참고해 이식한다.
- 작업자는 `nextjs-migration/` 내부에서 기존 UI, 컴포넌트, 데이터, 스타일, 타입을 단계적으로 옮기고 검증한다.
- 모든 마이그레이션 작업과 검증이 끝나면 사용자에게 최종 확인을 요청한다.
- 기존 프로젝트 루트를 최종 Next.js 프로젝트로 대체하거나 전환하는 작업은 사용자 확인 이후에만 진행한다.

예시 명령:
```sh
npx create-next-app@latest nextjs-migration
```

`create-next-app` 선택 기준:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: No
- `src/` directory: Yes
- App Router: Yes
- Import alias: 기본값 `@/*`로 시작하되, 기존 alias와 병합 가능하게 유지한다.
- `--yes`는 사용하지 않는다. 최신 기본값에 Tailwind CSS가 포함될 수 있으므로, 대화형 custom 선택으로 생성한다.
- 기존 프로젝트가 npm을 사용하므로 최종 마이그레이션 프로젝트도 npm과 `package-lock.json`을 유지한다.

작업 항목:
- Next.js, React, TypeScript 설정을 도입한다.
- 기존 npm 사용을 유지한다.
- 기존 ESLint, TypeScript strict 설정을 가능한 한 유지한다.
- Radix UI, Jotai 등 기존/전환 런타임 의존성은 필요 범위에서 유지한다.
- 스타일 작성 기준은 Radix UI와 CSS Modules로 둔다.
- 기존 UI 임시 이식을 위해 `styled-components`를 설치할 수 있으나, 신규 코드에는 사용하지 않는다.
- Vite 전용 설정과 Next.js 설정의 충돌 지점을 정리한다.

완료 기준:
- `nextjs-migration/` 내부에서 `npm run dev`로 Next.js 개발 서버가 실행된다.
- 빈 페이지 또는 최소 shell이 렌더링된다.
- CSS Modules 기반 최소 shell이 정상 렌더링된다.
- 기존 기능 이전은 아직 하지 않는다.

판단 지점:
- `src/` 구조를 유지할지, Next.js 관례에 맞춰 `app/` 중심으로 재배치할지 결정한다.

## 3단계: 라우팅 이전
React Router 기반 페이지를 Next.js App Router로 옮긴다.

대상 예시:
- `/`
- `/novel/[id]`
- `/comic/[id]`
- `/heartbeat`
- `/onthestage`
- `/players`
- `/404` 또는 `not-found.tsx`

작업 방식:
- 기존 page 컴포넌트의 렌더링 로직을 최대한 유지한다.
- `useParams`, `useNavigate`, `Link` 사용부를 Next.js API로 교체한다.
- 라우팅 이전 중에는 데이터는 기존 `src/lib/*.ts`를 계속 사용한다.

완료 기준:
- 기존 주요 URL이 Next.js 라우트로 열린다.
- 데이터 DB 이전 없이 기존 화면과 최대한 동일하게 보인다.

## 선행 단계: Recoil에서 Jotai로 이전
Next.js 화면 이식 전에 원본 Vite 앱에서 Recoil을 Jotai로 교체한다. Recoil은 React 19/Next.js 16 런타임에서 문제가 확인되었으므로, Next.js 마이그레이션 중 임시 유지하지 않는다.

대상 상태:
- `adminAtom`: 제한 콘텐츠 열람 권한 상태다. 10단계에서 `privateReaderAtom`으로 재명명한다.
- `appearanceAtom`
- `fontAtom`
- `sidebarAtom`

작업 원칙:
- 원본 Vite 앱에서 먼저 전환하고 `npm run lint`, `npm run build`로 기존 동작 기준선을 확보한다.
- `localStorageEffect` 역할은 Jotai storage atom 또는 동등한 유틸로 대체한다.
- `RecoilRoot`는 제거한다.
- 전환 후 Recoil import가 남아 있으면 안 된다.
- Next.js 쪽에는 Jotai 기준 상태 파일을 이식한다.

권장 순서:
1. Jotai 의존성을 추가한다.
2. `sidebarAtom`처럼 영향 범위가 작은 상태부터 교체한다.
3. `appearanceAtom`과 `fontAtom`을 교체하고 테마/폰트 동작을 검증한다.
4. `adminAtom`을 교체하고 제한 콘텐츠 열람/출판 소설 접근 동작을 검증한다.
5. Recoil Provider와 Recoil 의존성을 제거한다.
6. 원본 Vite 앱에서 lint/build를 실행한다.
7. Next.js 마이그레이션 프로젝트의 Provider와 atom도 Jotai 기준으로 맞춘다.

완료 기준:
- Recoil import가 원본 앱과 Next.js 마이그레이션 앱에서 제거되었다.
- 기존 사이드바, 테마, 폰트, 제한 콘텐츠 접근 상태 동작이 유지된다.
- 원본 앱과 Next.js 마이그레이션 앱의 `npm run lint`, `npm run build`가 통과한다.

## 4단계: 레이아웃 및 상태 이전
기존 `Layout`, `Header`, `Sidebar`, Jotai 상태를 Next.js 환경에서 안정화한다.

작업 항목:
- 클라이언트 컴포넌트가 필요한 영역에 `"use client"`를 명시한다.
- Jotai Provider 필요 여부와 상태 파일 위치를 정한다.
- 브라우저 API 사용부는 클라이언트 컴포넌트 내부로 제한한다.
- 기존 Radix UI 컴포넌트 사용은 유지하고, `styled-components`로 작성된 스타일만 CSS Modules로 옮긴다.
- 원본 JSX 구조를 단순화하거나 Radix 컴포넌트를 네이티브 DOM/CSS로 대체해야 할 경우에는 먼저 이유를 기록하고 확인받는다.
- `sessionStorage`, click outside hook 등 클라이언트 의존 로직을 점검한다.

완료 기준:
- 사이드바 열림/닫힘, 스크롤 복원, 기존 `admin` 상태로 처리되던 제한 콘텐츠 열람 동작이 유지된다.

판단 지점:
- Jotai 전환은 선행 단계에서 완료되어 있어야 한다.

## 5단계: R2 객체 저장소 연동 정리
Cloudflare R2는 유지한다. Next.js 서버 코드에서 R2에 접근할 수 있도록 정리한다.

작업 항목:
- `server/storage.ts`에 R2 S3 호환 클라이언트를 구성한다.
- R2 접근 키는 서버 환경변수로만 관리한다.
- 만화 이미지와 Markdown 파일의 key 규칙을 확정한다.
- R2 객체는 Next.js API를 통해 프록시한다.

콘텐츠 접근 정책:
- R2 버킷은 직접 접근 가능한 public bucket으로 열지 않는다.
- 공개/비공개 접근 여부는 사이트 내부 로직과 Next.js API에서 결정한다.
- 소설 Markdown은 Next.js Route Handler를 통해 읽어 내려준다.
- 미출판/미제한 소설은 공개 콘텐츠로 취급하며, API 주소로 직접 요청해도 파일 제공이 가능하다.
- 출판된 소설 번역본은 제한 콘텐츠로 취급하며, `private-reader` 권한 없이는 401 또는 403을 반환한다.
- 만화는 전체 공개 콘텐츠로 취급한다. 단, R2 직접 접근은 허용하지 않고 Next.js API에서 이미지 URL 목록과 파일 응답을 제공한다.
- 제한 콘텐츠 열람 권한과 실제 DB 수정 관리자 권한은 분리한다.

기존 Worker 참고:
- 저장소: `/Users/nine/Documents/nine/monoasobi-workers`
- R2 binding: `CONTENTS_BUCKET`
- R2 bucket: `monoasobi-contents`
- 기존 소설 Markdown key: `novel/{id}.md`
- 기존 만화 이미지 prefix: `comics/{comicId}/`

기존 API 대응:
```txt
GET /novel/:id          -> GET /api/content/novels/[id]
GET /comic/:id          -> GET /api/content/comics/[id]
GET /comic-file/:key    -> GET /api/content/comic-file/[key]
```

R2 프록시 응답 지침:
- R2 원본 URL, account id, bucket endpoint는 브라우저에 노출하지 않는다.
- R2 객체 body는 가능하면 streaming 응답으로 전달한다.
- R2 object metadata를 바탕으로 `Content-Type`을 정확히 설정한다.
- 이미지 응답은 `Cache-Control`을 설정한다. 예: `public, max-age=86400`.
- Markdown 응답은 `Content-Type: text/markdown; charset=utf-8`을 설정한다.
- 가능하면 `ETag` 또는 R2 object httpEtag를 전달한다.
- 404, 401, 403 응답을 명확히 구분한다.
- 만화는 공개 콘텐츠이므로 API URL 직접 요청은 허용한다. 단, R2 직접 접근은 허용하지 않는다.
- 출판된 소설 번역본은 API URL 직접 요청도 `private-reader` 권한 없이는 차단한다.

완료 기준:
- Next.js 서버 코드에서 R2 객체를 읽을 수 있다.
- 브라우저에 R2 secret이 노출되지 않는다.

## 6단계: DB 스키마 설계
Turso + Drizzle을 기준으로 스키마를 정의한다.

초기 테이블:
```txt
musics
novels
comics
books
book_novels
book_purchase_links
lyric_tracks
```

설계 원칙:
- `music.ts`의 `id`는 가능한 유지한다.
- `novel.musicId`, `comic.musicId`, `bookId` 관계를 명시한다.
- 가사는 줄 단위 테이블보다 곡별 JSON 저장을 우선한다.
- R2 파일은 DB에 파일 내용이 아니라 object key만 저장한다.

완료 기준:
- Drizzle schema가 작성되었다.
- migration 생성과 적용 명령이 정의되었다.
- 초기 seed 전략이 정해졌다.

판단 지점:
- `lyrics`를 DB JSON으로 옮길지, R2 JSON/Markdown으로 유지하고 DB에는 key만 둘지 결정한다.

## 7단계: 기존 lib 데이터 마이그레이션
`src/lib/*.ts`와 `src/lib/lyrics/*.json`의 데이터를 DB seed로 이전한다.

작업 항목:
- `music.ts` -> `musics`
- `novel.ts` -> `novels`
- `comic.ts` -> `comics`
- `book.ts` -> `books`, `book_novels`, `book_purchase_links`
- `lyrics/*.json` -> `lyric_tracks` 또는 R2

완료 기준:
- DB 데이터가 기존 정적 데이터와 동일하다.
- 기존 `id` 기반 URL이 깨지지 않는다.

## 8단계: 읽기 API 구축
프론트와 다른 Codex 프로젝트가 사용할 읽기 API를 만든다.

Agent API:
```txt
GET /api/agent/catalog
GET /api/agent/musics
GET /api/agent/musics/[id]
GET /api/agent/musics/search?q=
```

인증:
```http
Authorization: Bearer <AGENT_API_TOKEN>
```

원칙:
- Agent API는 읽기 전용이다.
- MCP는 사용하지 않는다.
- 토큰은 강한 보안보다 의도치 않은 공개 접근 방지를 위한 최소 장치로 본다.
- 다른 프로젝트의 `AGENTS.md`에는 endpoint와 필요한 환경변수 이름만 기록한다.

완료 기준:
- Authorization 헤더 없이는 401을 반환한다.
- 올바른 토큰으로 catalog 데이터를 조회할 수 있다.
- 응답 스키마가 문서화되어 있다.

## 9단계: 프론트 데이터 소스 교체
기존 `src/lib` import를 API 또는 서버 DB 조회로 교체한다.

작업 순서:
1. 사이드바 음악 목록
2. 소설 상세
3. 만화 상세
4. 구매 안내
5. 가사 로딩
6. 특수 페이지 데이터

완료 기준:
- 프론트에서 정적 `lib` 배열에 의존하지 않는다.
- 기존 페이지 동작과 URL이 유지된다.
- 로딩/에러 상태가 정의되어 있다.

## 10단계: 기존 admin 명명 정리
기존 코드에서 `admin`으로 부르던 개념은 사이트 관리자가 아니라 제한 콘텐츠 접근 가능자다. 새 사이트 관리자 기능을 만들기 전에 이 명명을 먼저 정리한다.

목표:
- 기존 `admin` 의미를 `private-reader` 또는 그에 준하는 명칭으로 변경한다.
- 새로 만들 사이트 관리자 `admin`과 제한 콘텐츠 접근 권한이 섞이지 않게 한다.
- 이 단계에서는 DB 수정용 어드민 페이지를 만들지 않는다.

작업 항목:
- `adminAtom`을 `privateReaderAtom` 또는 명확한 제한 콘텐츠 접근 상태 이름으로 변경한다.
- 기존 `Admin.page`가 제한 콘텐츠 접근 로그인 화면이라면 `PrivateReader.page` 등으로 역할에 맞게 재명명한다.
- 기존 `/auth` 호출은 제한 콘텐츠 접근 인증으로 취급하고, 새 사이트 관리자 인증과 분리한다.
- UI 문구에서 실제 사이트 관리자가 아닌 곳의 "관리자" 표현을 제한 콘텐츠 접근 의미로 수정한다.
- 출판된 소설 접근 로직이 변경 후 명칭으로도 동일하게 동작하는지 확인한다.

완료 기준:
- 코드에서 기존 의미의 `admin` 명명이 제한 콘텐츠 접근 의미로 정리되었다.
- 새 사이트 관리자용 `admin` 명칭을 사용할 공간이 확보되었다.
- 출판된 소설 번역본 접근 권한 동작이 기존과 동일하다.

## 11단계: 어드민 페이지 신설
DB 데이터를 한 번에 보고 수정할 수 있는 어드민 페이지를 만든다.

용어 정의:
- `private-reader`: 기존 코드에서 `admin`으로 부르던 제한 콘텐츠 접근 가능자다. 출판된 소설 번역본 열람 권한만 가진다.
- `admin`: 새로 정의하는 사이트 관리자다. DB 데이터 관리와 `/api/admin/*` 접근 권한을 가진다.

초기 범위:
- 음악 목록 조회/수정
- 소설 목록 조회/수정
- 만화 목록 조회/수정
- 책과 구매 링크 조회/수정
- 관계 필드 선택 UI: `musicId`, `bookId`, `novelIds`

권한:
- Agent API 토큰과 사이트 관리자 인증은 분리한다.
- 사이트 관리자 쓰기 API는 별도 인증을 사용한다.
- 제한 콘텐츠 열람 권한과 DB 수정 관리자 권한은 분리한다.

권한 모델:
```txt
private-reader
  - 기존 코드의 admin 의미를 대체한다.
  - 출판된 소설 번역본 같은 제한 콘텐츠를 읽을 수 있다.
  - 미출판/미제한 소설과 만화처럼 공개 콘텐츠에는 필요하지 않다.
  - DB 수정 권한은 없다.

admin
  - 마이그레이션 후 신설되는 사이트 관리자 권한이다.
  - DB 데이터를 조회/생성/수정/삭제할 수 있다.
  - 어드민 페이지와 /api/admin/* 에만 사용한다.

agent
  - 다른 Codex 프로젝트가 catalog 데이터를 읽기 위해 사용한다.
  - /api/agent/* 읽기 전용 API에만 사용한다.
```

사이트 관리자 인증 구현 방향:
- 기존 Worker의 `ADMIN` 값은 사이트 관리자 비밀번호가 아니라 제한 콘텐츠 접근용 legacy secret으로 취급한다.
- 새 사이트 관리자 비밀번호는 코드나 설정 파일에 직접 두지 않는다.
- `ADMIN_PASSWORD` 또는 더 명확한 이름의 서버 환경변수로 관리한다.
- 로그인 API는 `POST /api/admin/auth/login` 형태로 둔다.
- 성공 시 httpOnly, secure, sameSite 쿠키 기반 세션을 발급한다.
- `/api/admin/*` 쓰기 API는 매 요청마다 세션을 검증한다.
- Agent API의 `AGENT_API_TOKEN`과 어드민 세션은 서로 대체할 수 없다.
- 제한 콘텐츠 열람용 토큰 또는 세션은 `PRIVATE_READER_*` 이름으로 분리한다.
- 초기 구현은 단일 관리자 비밀번호 기반으로 시작해도 된다. 단, 쿠키 세션 만료와 로그아웃은 구현한다.

어드민 입력 검증 방향:
- 기존 정적 데이터의 union 타입은 개발 중 필수 필드 누락을 막는 역할을 했다.
- Zod schema를 작성할 때는 기존 `src/types/*.d.ts`의 union 타입과 조건부 필수 규칙을 먼저 확인하고, 그 의도를 입력 검증 규칙으로 옮긴다.
- DB 전환 후에는 이 역할을 어드민 폼 검증과 서버 저장 전 검증으로 옮긴다.
- Drizzle schema는 DB 구조와 쿼리 타입을 담당한다.
- Zod schema는 어드민 입력값과 서버 저장 전 검증을 담당한다.
- TypeScript type은 UI와 query 반환값 타입을 담당한다.
- 조건부 필수값은 Zod의 `superRefine` 또는 동등한 서버 검증으로 처리한다.
- 예: `translated === true`이면 `translator`, `translatorUrl` 필수.
- 예: `isPublished === true`이면 `bookId` 필수.
- Zod는 관리자 생성/수정 API에 우선 적용하고, 단순 조회 응답에는 과하게 적용하지 않는다.

서버 코드 역할 분리:
- `app/api/**/route.ts`는 controller 역할로 본다.
- `route.ts`는 요청/응답, 인증 확인, body 파싱, Zod 검증 실행, status code 처리를 담당한다.
- 읽기 로직은 `server/queries/*`에 둔다.
- 쓰기 로직은 `server/mutations/*`에 둔다.
- Zod schema 정의는 `server/schemas/*`에 둔다.
- `route.ts`는 schema를 import해 `parse` 또는 `safeParse`로 request validation을 실행한다.
- DB 존재성, 관계 무결성, 트랜잭션처럼 저장 과정에 필요한 검증은 `server/mutations/*`에서 처리한다.
- `generateMetadata`, 페이지 서버 컴포넌트, Agent API는 가능하면 `queries`만 사용한다.
- Admin API만 `mutations`를 사용한다.

어드민 폼 구현 방향:
- 어드민 생성/수정 폼에는 React Hook Form과 Zod resolver를 우선 사용한다.
- 단순 로그인, 검색어, 필터, 토글처럼 작은 폼은 기존처럼 `useState`로 처리해도 된다.
- React Hook Form은 폼 상태, `defaultValues`, `dirty`, submit, field error 표시를 담당한다.
- Zod는 조건부 필수값과 저장 전 데이터 검증을 담당한다.
- Radix Themes는 UI와 레이아웃을 담당한다.
- `TextField.Root`처럼 네이티브 input에 가까운 컴포넌트는 `register`를 우선 사용한다.
- `Select`, `Switch`, `Checkbox`, `SegmentedControl`처럼 `value/onValueChange` 또는 `checked/onCheckedChange` 기반 컴포넌트는 `Controller`를 사용한다.
- Radix select 값은 문자열인 경우가 많으므로 `musicId`, `bookId` 등 숫자 필드는 `Number(value)` 변환을 명시한다.

추천 파일:
```txt
server/auth/admin.ts
server/auth/private-reader.ts
server/auth/agent.ts
server/queries/music.ts
server/queries/novel.ts
server/queries/comic.ts
server/queries/book.ts
server/mutations/music.ts
server/mutations/novel.ts
server/mutations/comic.ts
server/mutations/book.ts
server/schemas/music.schema.ts
server/schemas/novel.schema.ts
server/schemas/comic.schema.ts
server/schemas/book.schema.ts
app/api/admin/auth/login/route.ts
app/api/admin/auth/logout/route.ts
```

권장 UI:
- 테이블 기반 목록
- 상세 편집 패널 또는 모달
- 관계 데이터는 select/combobox로 선택
- 저장 전 변경사항 확인

완료 기준:
- DB 주요 데이터를 웹에서 확인할 수 있다.
- 최소한 기존 `music.ts`, `novel.ts`, `comic.ts`, `book.ts` 수준의 데이터는 수정 가능하다.
- 잘못된 관계 저장을 막는 기본 검증이 있다.
- 어드민 페이지 접근과 `/api/admin/*` 쓰기 요청이 어드민 세션 없이는 차단된다.
- 제한 콘텐츠 열람 권한만으로는 DB 수정 API를 호출할 수 없다.

## 12단계: 기존 Cloudflare 서버리스 의존 정리
Next.js API로 대체 가능한 기능을 옮긴다.

현재 Worker 인벤토리:
```txt
POST /auth
GET /novel/:id
GET /comic/:id
GET /comic-file/:key
GET /orders
```

현재 Worker 리소스:
- R2: `monoasobi-contents`
- KV: `orders`
- env var: `ADMIN`: legacy 이름이며 실제 의미는 제한 콘텐츠 접근 secret이다.
- CORS: 모든 origin 허용

작업 항목:
- 기존 Cloudflare Worker API 목록 작성
- Next.js API로 이전할 기능 구분
- R2 자체는 유지
- 더 이상 필요 없는 Worker 배포/환경변수 제거 여부 판단

권장 이전 방향:
- `/novel/:id`는 Next.js Route Handler에서 R2의 `novel/{id}.md`를 읽어 응답한다.
- 소설 응답 시 DB의 출판/제한 상태를 먼저 확인한다. 미출판/미제한 소설은 공개 제공하고, 출판된 소설 번역본은 `private-reader` 권한을 요구한다.
- `/comic/:id`는 R2의 `comics/{comicId}/` 목록을 읽고 정렬 가능한 이미지 URL 배열을 응답한다.
- `/comic-file/:key`는 R2 직접 URL로 대체하지 않는다. 만화는 공개 콘텐츠이지만 파일 응답은 Next.js Route Handler로 프록시한다.
- `/auth`는 기존 단순 비밀번호 인증을 임시 유지할 수 있으나, 제한 콘텐츠 열람 권한으로 이름을 재정의한다. 새 사이트 관리자 쓰기 API와는 별도 세션 또는 토큰 구조로 분리한다.
- `/orders`와 기존 주문 조회 페이지는 임시 기능으로 보고 Next.js 마이그레이션 과정에서 제거한다. 필요 시 별도 DB/API로 새로 구현한다.

보안 이전 원칙:
- 기존 `ADMIN` 값은 제한 콘텐츠 접근 secret으로 취급하고, 마이그레이션 시 `PRIVATE_READER_*` 환경변수로 이름을 바꾸며 새 값으로 rotation한다.
- 제한 콘텐츠 열람용 기존 authorization 문자열도 새 환경변수 기반 값으로 교체한다.
- 실제 토큰/비밀번호 값은 `AGENTS.md`, README, migration guide, 코드에 기록하지 않는다.
- 주문 조회 기능은 개인정보성 데이터를 다루며 임시 기능이었으므로 이번 마이그레이션에서 제거한다.

프론트 변경 대상:
- `VITE_WORKER_URL` 직접 호출을 제거한다.
- `NovelReader`, `ComicReader`, `Admin.page`의 fetch 대상은 Next.js 내부 API로 교체한다.
- `Order202507.page`, `Order202512.page` 및 관련 라우트는 제거한다.
- 개발 모드에서 `location.origin/novel/{id}.md`를 먼저 읽는 fallback은 Next.js 이전 후 제거하거나 명시적 local fixture로 대체한다.

완료 기준:
- 유지할 Cloudflare 리소스와 제거할 리소스가 구분되었다.
- 운영 문서가 업데이트되었다.

## 13단계: 검증 및 배포
검증 명령:
```sh
npm run lint
npm run build
```

확인 항목:
- 기존 주요 URL 접근 가능
- 이미지와 Markdown 로딩 정상
- Agent API 인증 및 응답 정상
- 어드민 조회/수정 정상
- DB seed 재실행 또는 migration 절차 확인
- 환경변수 문서화

완료 기준:
- Next.js 버전이 기존 기능을 대체할 수 있다.
- 결정권자가 기존 Vite 앱에서 Next.js 앱으로 전환 승인했다.

## 후속 Sub Task: 페이지별 Open Graph Metadata 적용
현재 React 앱은 페이지 전체에 공통 Open Graph만 사용한다. Next.js 마이그레이션과 DB/API 전환이 완료된 뒤, 각 페이지별 metadata를 생성하도록 변경한다.

작업 원칙:
- 이 작업은 Next.js 마이그레이션 완료 후 진행한다.
- App Router의 `metadata` 또는 `generateMetadata`를 사용한다.
- 정적 페이지는 `metadata`를 사용하고, `id` 기반 동적 페이지는 `generateMetadata`를 사용한다.
- `generateMetadata`에서 `app/api/**/route.ts`의 `GET` 함수를 직접 호출하지 않는다.
- API route와 metadata는 같은 서버 query 함수를 공유한다.
- 내부 HTTP fetch보다 `server/queries/*` 함수를 직접 import하는 방식을 우선한다.

권장 구조:
```txt
server/
  queries/
    musics.ts
    novels.ts
    comics.ts
    books.ts

app/
  novel/[id]/page.tsx
  comic/[id]/page.tsx
  heartbeat/page.tsx
  onthestage/page.tsx
  players/page.tsx
```

예시:
```ts
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const novel = await getNovelDetail(Number(id));

  return {
    title: `${novel.title} - monoasobi`,
    description: `${novel.writer}의 소설`,
    openGraph: {
      title: `${novel.title} - monoasobi`,
      description: `${novel.writer}의 소설`,
      images: [novel.ogImageUrl ?? "/images/opengraph.png"],
    },
  };
}
```

초기 적용 대상:
- `/`
- `/novel/[id]`
- `/comic/[id]`
- `/heartbeat`
- `/onthestage`
- `/players`
- 주문/안내 페이지

메타데이터 구성 기준:
- 소설 페이지: 소설 제목, 작가, 연결된 음악 제목을 사용한다.
- 만화 페이지: 만화 제목, 작가, 연결된 음악 제목을 사용한다.
- 특수 페이지: `music.specialPath`와 연결된 음악 데이터를 사용한다.
- 기본 이미지는 기존 `public/images/opengraph.png`를 유지한다.
- 페이지별 이미지가 필요해지면 DB에 `ogImageKey` 또는 `ogImageUrl` 필드를 추가하는 방안을 별도 판단한다.

완료 기준:
- 주요 페이지별 `<title>`과 Open Graph title/description이 다르게 생성된다.
- 동적 페이지 metadata가 DB 조회 결과를 반영한다.
- API route와 `generateMetadata`가 동일한 서버 query 함수를 공유한다.
- `npm run build`에서 metadata 관련 타입 오류가 없다.

## 후속 Sub Task: React Compiler 활성화
React Compiler는 최종 Next.js 앱에서 사용한다. 다만 마이그레이션 중에는 라우팅, Server/Client Component 경계, legacy styled-components 제거, 상태관리, DB/API 전환 문제와 원인을 분리하기 위해 비활성 상태로 둔다.

적용 시점:
- Next.js 마이그레이션 본 작업이 완료되었다.
- 기존 주요 URL과 제한 콘텐츠 열람 동작이 유지된다.
- Recoil에서 Jotai 전환이 완료되었다.
- 신규 스타일 기준이 CSS Modules로 정리되었고, legacy styled-components 사용이 제거되었거나 제거 계획이 명확하다.
- `npm run lint`와 `npm run build`가 통과하는 안정 기준선이 있다.

작업 항목:
- Next.js 공식 문서 또는 설치된 Next.js 로컬 문서에서 현재 `reactCompiler` 설정 방식을 확인한다.
- `next.config.ts`에 `reactCompiler: true`를 추가한다.
- 수동 memoization이 남아 있더라도 기능 변경 없이 먼저 compiler만 켠다.
- 빌드 시간과 개발 서버 반응 속도 변화를 기록한다.
- 렌더링 차이가 의심되는 화면을 우선 확인한다. 대상은 사이드바, 가사 플레이어, 소설/만화 리더, private-reader 권한 분기다.

예시:
```ts
const nextConfig = {
  reactCompiler: true,
};
```

완료 기준:
- React Compiler가 활성화된 상태에서 `npm run lint`와 `npm run build`가 통과한다.
- 주요 페이지가 기존과 동일하게 동작한다.
- compiler 활성화 전후의 빌드 시간 또는 확인 결과가 문서화되어 있다.

## Codex 작업 규칙
- 각 단계 시작 전에 목표와 변경 파일을 먼저 설명한다.
- 단계 중 관련 없는 리팩터링은 하지 않는다.
- 단계가 끝나면 변경 요약, 확인한 명령, 남은 판단 지점을 보고한다.
- 결정이 필요한 경우 임의로 확정하지 않고 선택지를 제시한다.
- 커밋 메시지는 짧은 한 줄 영어로 작성한다.

예시 커밋:
```txt
Add Next.js migration guide
```
