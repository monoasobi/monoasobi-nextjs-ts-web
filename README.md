# MONOASOBI

MONOASOBI는 YOASOBI의 노래와 연결된 원작 소설, 만화, 가사 콘텐츠를 모아 감상하는 웹 앱입니다.

소설과 만화는 음악별로 탐색할 수 있고, 일부 곡은 전용 특수 페이지를 제공합니다. 가사 플레이어는 YouTube 영상과 함께 싱크된 가사, 콜/박수 가이드, 읽기 보조 정보를 보여줍니다.

## 주요 기능

- 음악별 소설과 만화 탐색
- Markdown 기반 소설 리더
- 이미지 기반 만화 리더
- YouTube 연동 가사 플레이어
- `heartbeat`, `onthestage`, `players` 전용 페이지
- 출판된 제한 콘텐츠를 위한 private-reader 로그인
- 사이트 관리자용 데이터 관리 화면
- 외부 프로젝트에서 catalog를 읽기 위한 Agent API
- 페이지별 Open Graph metadata

## 기술 스택

- Next.js 16 App Router
- React 19
- TypeScript
- Radix UI Themes
- CSS Modules
- Jotai
- Turso, Drizzle ORM
- Cloudflare R2
- Zod

## 시작하기

```sh
npm install
npm run dev
```

개발 서버는 기본적으로 `http://localhost:3000`에서 실행됩니다.

## 환경 변수

로컬 개발에서는 `.env.local`을 사용합니다. secret 값은 코드나 문서에 기록하지 않습니다.

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_END_POINT=

PRIVATE_READER_PASSWORD=
PRIVATE_READER_SESSION_SECRET=

ADMIN_PASSWORD=
ADMIN_SESSION_SECRET=
AGENT_API_TOKEN=

TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
```

## 주요 명령

```sh
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```

DB 관련 명령:

```sh
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:studio
```

## 프로젝트 구조

```txt
src/app
  page.tsx                      홈
  novel/[id]/page.tsx           소설 상세
  comic/[id]/page.tsx           만화 상세
  heartbeat/page.tsx            특수 페이지
  onthestage/page.tsx           특수 페이지
  players/page.tsx              특수 페이지
  private/page.tsx              제한 콘텐츠 로그인
  admin/page.tsx                사이트 관리자
  api/content/*                 콘텐츠 API
  api/private-reader/*          제한 콘텐츠 인증 API
  api/admin/*                   관리자 API
  api/agent/*                   읽기 전용 Agent API

src/components
  common/                       영상과 가사 UI
  content/                      소설, 만화, 구매, 번역 UI
  custom/                       홈, 가이드, 특수 페이지 UI
  layout/                       앱 프레임, 헤더, 사이드바

src/server
  auth/                         권한별 인증 로직
  db/                           DB client, schema, seed
  queries/                      조회 로직
  mutations/                    쓰기 로직
  schemas/                      입력 검증
  storage.ts                    R2 접근
```

## 권한

- `admin`: 사이트 관리자 화면과 `/api/admin/*` 쓰기 API에 사용하는 권한입니다.
- `agent`: 외부 프로젝트가 `/api/agent/*` 읽기 API를 호출할 때 사용하는 토큰입니다.

## 콘텐츠 저장소

소설 Markdown과 만화 이미지는 Cloudflare R2에 저장합니다.

```txt
novel/{id}.md
comics/{comicId}/{page}.jpg
```

R2 원본 URL은 브라우저에 직접 노출하지 않고 앱 API를 통해 제공합니다.

## Agent API

읽기 전용 catalog API입니다.

```http
Authorization: Bearer <AGENT_API_TOKEN>
```

엔드포인트:

- `GET /api/agent/catalog`
- `GET /api/agent/musics`
- `GET /api/agent/musics/[id]`
- `GET /api/agent/musics/search?q=keyword`

## 참고 문서

- `MIGRATION_NOTES.md`
- `src/server/db/SEEDING.md`
- `src/app/api/agent/README.md`
