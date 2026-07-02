# Next.js Migration Notes

이 문서는 MONOASOBI Next.js 앱이 만들어진 배경과 마이그레이션 작업 범위를 기록합니다. 프로젝트 사용법과 소개는 `README.md`를 기준으로 봅니다.

## 배경

MONOASOBI는 기존에 Vite 기반 React CSR 앱과 별도 Cloudflare Worker로 구성되어 있었습니다.

- Vite 앱: 공개 화면, 소설/만화 리더, 특수 페이지, 제한 콘텐츠 열람 상태
- Cloudflare Worker: R2 콘텐츠 API, 제한 콘텐츠 인증, 임시 주문 조회 API
- 정적 데이터: `src/lib/*.ts`, `src/lib/lyrics/*.json`

Next.js 전환 후에는 페이지, API, DB 조회, R2 프록시, 관리자 기능을 한 앱 안에서 관리합니다.

## 마이그레이션 목표

- 기존 URL과 주요 화면 동작 유지
- 정적 데이터의 Turso/Drizzle DB 이전
- Cloudflare R2는 유지하되 Next.js API로 프록시
- 제한 콘텐츠 열람 권한과 사이트 관리자 권한 분리
- 외부 Codex 프로젝트용 읽기 API 제공
- React 19/Next.js 16 환경에 맞춰 Recoil을 Jotai로 교체
- Radix UI + CSS Modules 기준의 UI 구조 유지
- React Compiler 활성화

## 주요 변경 사항

### App Router

기존 React Router 라우트를 Next.js App Router로 이전했습니다.

- `/`
- `/novel/[id]`
- `/comic/[id]`
- `/heartbeat`
- `/onthestage`
- `/players`
- `/private`
- `/admin`

페이지 컴포넌트는 가능한 한 서버 컴포넌트로 유지하고, Jotai, 브라우저 API, 이벤트 핸들러가 필요한 UI는 client component로 분리했습니다.

### 데이터 원본

앱 런타임 데이터 원본은 Turso DB입니다. 기존 정적 데이터는 초기 bootstrap과 복구를 위한 seed 데이터로만 유지합니다.

```txt
src/server/db/seed-data/
```

### R2 콘텐츠

R2 object key는 DB 필드로 저장하지 않고 id 기반 규칙으로 파생합니다.

```txt
novel/{id}.md
comics/{comicId}/
```

R2 객체는 브라우저에 직접 노출하지 않고 다음 API로 제공합니다.

- `GET /api/content/novels/[id]`
- `GET /api/content/comics/[id]`
- `GET /api/content/comic-file/[...key]`

### 권한 분리

기존 앱에서 `admin`으로 부르던 제한 콘텐츠 열람 권한은 `private-reader`로 재정의했습니다.

- `private-reader`: 출판된 제한 콘텐츠 열람
- `admin`: DB 관리 화면과 `/api/admin/*`
- `agent`: 외부 읽기 API

### Admin

사이트 관리자 화면을 새로 추가했습니다.

- music
- novel
- comic
- lyricTrack
- book
- purchase links

API route는 controller 역할만 담당하고, 조회/쓰기/검증은 각각 `server/queries`, `server/mutations`, `server/schemas`로 분리했습니다.

### Metadata

페이지별 `metadata`와 `generateMetadata`를 적용했습니다. 동적 페이지 metadata는 API route를 HTTP로 호출하지 않고 `server/queries/*` 함수를 직접 공유합니다.

### React Compiler

Next.js 설정에서 React Compiler를 활성화했습니다.

```ts
reactCompiler: {
  compilationMode: "infer",
}
```

가사/영상 플레이어처럼 렌더링과 동기화가 민감한 컴포넌트의 수동 최적화는 보수적으로 유지했습니다.

## 제외 또는 보류 항목

다음 항목은 이 마이그레이션 작업 범위에서 제외했거나 사용자가 직접 정리하기로 한 항목입니다.

- 기존 Vite CSR 앱 삭제
- `nextjs-migration/` 루트 승격
- Vercel 또는 배포 플랫폼 환경변수 설정
- Turso, R2, secret 값의 외부 대시보드 설정
- 실제 운영 배포 실행
- Admin 화면의 R2 콘텐츠 존재 상태 표시
- 기존 Cloudflare Worker 제거 여부 판단
- 기존 주문 조회 기능 재구현
