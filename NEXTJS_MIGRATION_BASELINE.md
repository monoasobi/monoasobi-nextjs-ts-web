# Next.js Migration Baseline

## 목적
Next.js 이전 중 화면과 동작을 비교하기 위한 기존 Vite 앱의 기준선이다. 이 문서는 1단계 산출물이며, 현재 구현을 읽고 정리한 내용이다.

## 확인 기준
- 기존 앱 빌드 기준: `npm run build` 통과
- 라우터 기준 파일: `src/utils/browserRouter.tsx`
- 공통 레이아웃 기준 파일: `src/components/layout/Layout.tsx`
- 전역 상태 기준 파일: `src/atoms/*.atom.ts`

## 기존 주요 라우트
| URL | 기존 컴포넌트 | 기준 동작 |
| --- | --- | --- |
| `/` | `Overview` | YOASOBI 소개, MONOASOBI 설명, 기능 소개, 추천 동선 안내를 렌더링한다. |
| `/novel/:id` | `Novel` | `src/lib/novel.ts`와 `src/lib/music.ts`에서 데이터를 찾고, 없으면 `/404`로 이동한다. |
| `/comic/:id` | `Comic` | `src/lib/comic.ts`와 `src/lib/music.ts`에서 데이터를 찾고, 없으면 `/404`로 이동한다. |
| `/onthestage` | `OnTheStage` | `musics[26]` 기반 특수 화면을 `ContentsContainer` 안에 렌더링한다. |
| `/heartbeat` | `HeartBeat` | `musics[24]`와 연결 소설 기반 특수 화면을 `ContentsContainer` 안에 렌더링한다. |
| `/players` | `Players` | `musics[29]`와 연결 소설 기반 특수 화면을 `ContentsContainer` 안에 렌더링한다. |
| `/admin` | `Admin` | 제한 콘텐츠 열람 권한을 활성화하는 legacy 로그인 화면이다. 사이트 관리자 화면이 아니다. |
| `/guide` | `Guide` | `NovelMarkdown` 작성 문법과 렌더링 예시를 보여준다. |
| `/404` | `NotFound` | 명시적 404 화면이다. |
| `/*` | `NotFound` | 매칭되지 않는 경로의 fallback이다. |

현재 `Order202507.page.tsx`, `Order202512.page.tsx`는 소스에 남아 있지만 React Router 목록에는 연결되어 있지 않다. 마이그레이션 가이드상 주문 조회 기능은 제거 대상이다.

## 레이아웃과 전역 상태
- `main.tsx`는 `App`을 렌더링한다.
- `App`은 Radix `Theme`과 React Router `RouterProvider`를 제공한다.
- `Layout`은 상단 `Header`, 좌측 `Sidebar`, 본문 `Outlet` 구조다.
- `sidebarAtom` 기본값은 `true`이며, 화면 폭이 1024px 미만이면 앱 시작 시 닫힌다.
- `appearanceAtom`은 `localStorage`의 `appearance`에 저장된다.
- `fontAtom`은 `localStorage`의 `font`에 저장된다.
- `adminAtom`은 `localStorage`의 `admin`에 저장된다. 현재 이름은 `admin`이지만 의미는 제한 콘텐츠 열람 권한이다.

## 사이드바 기준 동작
- 음악 목록은 `musics`와 `novels`를 조합해 소설이 있는 곡만 렌더링한다.
- `music.specialPath`가 있으면 해당 특수 경로로 이동하고, 없으면 `/novel/{novel.id}`로 이동한다.
- 현재 경로와 `param.id`를 기준으로 활성 항목을 표시한다.
- 모바일 폭에서는 외부 클릭 또는 항목 클릭 시 사이드바를 닫는다.
- 항목 클릭 위치를 `sessionStorage.sidebar`에 저장하고, 재마운트 시 해당 위치 근처로 복원한다.
- 정식 발매 소설은 제한 콘텐츠 열람 권한이 없고 특수 경로가 아닐 때 `정식 발매` 배지를 표시한다.

## 소설 페이지 기준 동작
- `/novel/:id`는 `novels.find(id)`와 연결 `music`을 찾는다.
- 소설 또는 음악이 없으면 `/404`로 이동한다.
- `novel.isPublished && !adminAtom`이면 전문 대신 `PurchaseLink`를 보여준다.
- 번역되지 않은 소설은 `Translate` 안내를 보여준다.
- 읽기 가능한 번역 소설은 `NovelReader`를 lazy load하고 `Loading` fallback을 보여준다.
- 제한 콘텐츠 열람 권한이 없고 정식 출판된 소설이면 역자 정보와 역자 URL도 숨긴다.
- `NovelReader`는 개발 모드에서 먼저 `{location.origin}/novel/{id}.md`를 시도한 뒤 실패하면 Worker `/novel/{id}`로 fallback한다.
- Worker 요청에는 `authorization` 헤더로 `adminAtom ? "monoasobi" : "yoasobi"`를 보낸다.
- 소설 스크롤 위치는 `localStorage.novel-{id}`에 저장하고 끝까지 읽으면 삭제한다.

## 만화 페이지 기준 동작
- `/comic/:id`는 `comics.find(id)`와 연결 `music`을 찾는다.
- 만화 또는 음악이 없으면 `/404`로 이동한다.
- `ComicReader`를 lazy load하고 `Loading` fallback을 보여준다.
- `ComicReader`는 Worker `/comic/{id}`에서 이미지 URL 배열을 가져온다.
- 이미지 URL은 `getFileNum` 기준으로 정렬한다.
- 만화 스크롤 위치는 `localStorage.comic-{id}`에 저장하고 끝까지 읽으면 삭제한다.
- 초기 4개 이미지는 eager, 이후 이미지는 lazy loading이다.

## 콘텐츠 컨테이너와 가사 플레이어
- `ContentsContainer`는 상단 floating header에 음악명과 콘텐츠 제목/작가를 표시한다.
- 우측 상단 popover는 역자 링크와 원문 링크를 제공한다.
- 우측 하단 floating 버튼은 본문 보기와 가사 보기 사이를 전환한다.
- 가사 보기는 query string `?view=lyrics`로 표현한다.
- `YouTubeLyricsPlayer`는 `loadLyricTrack(music.id)`로 `src/lib/lyrics/{musicId}.json`을 동적 import한다.
- YouTube 영상이 없으면 안내 카드를 보여준다.
- 개발 모드에서는 가사 sync 조정용 popover를 보여준다.
- 가사 파일 로딩, 실패, 미준비 상태를 각각 별도 카드로 표시한다.

## 제한 콘텐츠 열람 권한 기준 동작
- 현재 `/admin`은 사이트 관리자 기능이 아니라 제한 콘텐츠 열람 권한 활성화 화면이다.
- 비밀번호를 Worker `/auth`로 POST한다.
- 성공 시 `adminAtom`을 `true`로 저장하고 `/`로 이동한다.
- 실패 또는 오류 시 `adminAtom`을 `false`로 저장한다.
- 이 권한은 정식 출판 소설의 전문 열람과 사이드바 배지 표시, 역자 정보 노출에 영향을 준다.

## Next.js 이전 시 보존해야 할 핵심
- 기존 URL을 유지한다.
- 먼저 정적 `src/lib` 데이터 기반 화면을 복원한 뒤 DB/API로 교체한다.
- `admin` 명명은 새 사이트 관리자 기능을 만들기 전에 `private-reader` 의미로 정리한다.
- 브라우저 API, Jotai, legacy styled-components, event handler가 필요한 UI는 Client Component로 둔다.
- `page.tsx`는 가능한 한 얇게 유지하고 실제 UI는 기존 `components/*` 패턴을 따른다.
