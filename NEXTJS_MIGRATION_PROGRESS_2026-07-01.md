# Next.js 마이그레이션 진행 정리 - 2026-07-01

## 오늘의 목표
DB 전환은 잠시 미루고, 기존 정적 `src/lib` 데이터와 R2 콘텐츠 API를 유지한 상태에서 Next.js 마이그레이션 앱의 공개 프론트 화면을 최대한 완성하는 것을 목표로 했다.

## 오늘 완료한 작업

### Jotai 전환 유지
- Recoil 대신 Jotai 기준 상태를 유지했다.
- 제한 콘텐츠 열람 상태는 `privateReaderAtom` 이름으로 정리된 상태를 유지했다.
- `admin` 명명은 새 사이트 관리자 기능과 혼동되지 않도록 이후 단계에서 계속 분리하기로 했다.

### R2 콘텐츠 API 유지
- Cloudflare R2는 S3 호환 API로 접근하는 현재 구현을 유지했다.
- 소설 Markdown과 만화 이미지 목록/파일 프록시 API는 Next.js Route Handler로 동작한다.
- R2 secret은 `.env`와 서버 코드에서만 사용하고 브라우저에 노출하지 않는 방향을 유지했다.

### 소설 상세 화면
- `/novel/[id]` 화면을 기존 상세 페이지 흐름에 맞춰 이식했다.
- 출판된 작품은 구매 안내를 보여주고, 미출판 번역본은 R2 Markdown reader로 읽는다.
- 작품 정보 Popover, 본문/가사 전환 플로팅 버튼, 구매 링크 UI를 연결했다.

### 가사 플레이어
- 원본 `YouTubeLyricsPlayer`, `VideoPlayer`, `LyricsDisplayV2` 구조를 Next.js 앱으로 옮겼다.
- Radix UI 사용은 유지하고, styled-components 스타일만 CSS Modules로 변환했다.
- `src/lib/lyrics/*.json`은 현재 단계에서는 `public/lyrics/*.json`으로 복사해 클라이언트에서 불러온다.
- `/novel/[id]?view=lyrics`에서 YouTube 영상, 싱크 가사, 오프셋 조정 UI가 동작한다.

### 공개 프론트 placeholder 제거
- `/` 홈/오버뷰를 원본 `Overview.page.tsx` 기준으로 이식했다.
- `/guide` NovelReader 작성 가이드를 이식했다.
- `/comic/[id]` 만화 리더를 R2 프록시 API에 연결했다.
- `/heartbeat`, `/onthestage`, `/players` 특수 페이지를 원본 구조 기준으로 이식했다.
- 특수 페이지와 오버뷰에 필요한 이미지 자산을 `nextjs-migration/public/images/assets/`로 옮겼다.

## 확인한 내용
- `nextjs-migration`에서 `npm run lint` 통과.
- `nextjs-migration`에서 `npm run build` 통과.
- 브라우저에서 다음 페이지 렌더링을 확인했다.
  - `/`
  - `/guide`
  - `/novel/32?view=lyrics`
  - `/comic/1`
  - `/heartbeat`
  - `/onthestage`
  - `/players`
- `/comic/1`에서 R2 프록시 이미지 66장이 로드되는 것을 확인했다.
- 확인한 공개 페이지들에서 콘솔 error는 없었다.

## 현재 남은 placeholder
- `/private-reader`
  - 기존 `admin` 의미였던 제한 콘텐츠 열람 권한 화면이다.
  - 실제 인증 API와 권한 명명 정리가 함께 필요하므로 별도 단계로 남겼다.
- `/admin`
  - 새 사이트 관리자용 화면이다.
  - DB 전환, 관리자 인증, 관리자 API가 필요하므로 지금 단계에서는 placeholder로 남겼다.
- `RouteShell`
  - 위 두 placeholder가 남아 있어 아직 삭제하지 않았다.

## 앞으로 남은 큰 작업

### 1. 제한 콘텐츠 열람 인증 정리
- 기존 Worker의 `/auth`에 대응하는 Next.js 인증 흐름을 만든다.
- `admin`이라는 legacy 명칭을 `private-reader` 계열로 완전히 정리한다.
- `PRIVATE_READER_*` 환경변수 이름을 확정한다.
- `/private-reader` 화면을 실제 로그인 화면으로 교체한다.
- 출판된 소설 API 접근 권한 확인을 임시 문자열이 아니라 private-reader 권한 흐름으로 바꾼다.

### 2. DB 전환 재개
- Turso 서비스 생성 여부와 환경변수를 정한다.
- Drizzle schema와 migration을 실제 DB에 적용한다.
- 기존 `src/lib/*.ts`와 `lyrics/*.json`을 seed 데이터로 이전한다.
- 프론트 데이터 소스를 정적 배열에서 DB/API 기반 조회로 교체한다.

### 3. Agent 읽기 API
- DB seed 이후 `/api/agent/*` 읽기 전용 API를 만든다.
- `AGENT_API_TOKEN` 기반 인증을 붙인다.
- 다른 Codex 프로젝트가 읽을 응답 스키마를 문서화한다.

### 4. 새 사이트 관리자 기능
- `/admin`을 실제 사이트 관리자 화면으로 만든다.
- `ADMIN_*` 인증과 httpOnly cookie 세션을 구현한다.
- 음악, 소설, 만화, 책, 구매 링크 데이터를 조회/수정할 수 있게 한다.
- React Hook Form + Zod + Radix UI 기준으로 관리자 폼을 구성한다.

### 5. 최종 안정화
- 남은 `RouteShell` 제거.
- React Compiler를 켜는 별도 작업 진행.
- styled-components 잔여 의존성 제거 가능 여부 확인.
- 최종적으로 `nextjs-migration/`을 실제 루트 앱으로 전환할지 결정한다.

## 다음 작업을 시작할 때 추천 순서
1. `/private-reader`를 실제 제한 콘텐츠 열람 로그인 화면으로 교체한다.
2. `/api/content/novels/[id]`의 임시 authorization 값을 private-reader 인증 흐름으로 바꾼다.
3. 공개 페이지 전체를 한 번 더 훑고, `RouteShell`이 `/admin`만 남는지 확인한다.
4. 그 다음 DB/Turso 전환을 재개한다.

## 최종 업데이트
이 문서는 2026-07-01 작업 초반 진행 기록으로 작성되었고, 이후 같은 날 마이그레이션 핵심 작업이 추가로 완료되었다.

추가 완료 사항:
- `/private` 제한 콘텐츠 열람 인증을 Next.js API와 httpOnly cookie 세션 기준으로 정리했다.
- Turso + Drizzle DB 전환을 완료했고, 앱 런타임 데이터 원본을 DB로 전환했다.
- Agent 읽기 API와 token 인증을 추가했다.
- `/admin` 사이트 관리자 화면과 `music`, `novel`, `comic`, `lyricTrack`, `book` CRUD API를 추가했다.
- R2 콘텐츠 키는 DB 필드로 관리하지 않고 `novel/{id}.md`, `comics/{comicId}/` 규칙으로 조회하도록 정리했다.
- `youtubeId` nullable 변경 migration을 적용했다.
- React Compiler를 활성화했다.
- Next.js 앱에서 `styled-components` 의존성을 제거했다.

남은 작업:
- 기존 Vite CSR 앱 제거와 `nextjs-migration/` 루트 승격은 사용자가 직접 진행한다.
- 배포 환경변수 설정과 실제 배포 환경 빌드/동작 확인이 필요하다.
- 페이지별 Open Graph metadata 적용은 후속 개선 작업으로 남긴다.
