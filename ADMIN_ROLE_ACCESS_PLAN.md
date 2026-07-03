# Admin Role Access Plan

## 목적

관리자 화면을 실제 관리용 권한과 외부 공유용 조회 권한으로 분리합니다.
조회 권한은 관리자 화면과 타임라인 화면을 볼 수 있지만, DB 추가/수정/삭제에는 영향을 줄 수 없어야 합니다.

## 권한 정의

- `admin`: 실제 운영 관리 권한입니다. 기존 관리자 기능을 모두 사용할 수 있습니다.
- `viewer`: 외부 공유용 조회 권한입니다. 화면 조회와 DB에 영향을 주지 않는 기능만 사용할 수 있습니다.

## 환경변수

- 실제 관리자 비밀번호와 조회 권한 비밀번호는 별도 환경변수로 분리합니다.
- `ADMIN_PASSWORD`는 단일 실제 관리자 비밀번호로 사용합니다.
- `ADMIN_VIEWER_PASSWORDS`는 쉼표로 구분된 여러 viewer 비밀번호를 허용합니다.
- 각 비밀번호는 trim 처리 후 빈 값은 제외합니다.
- 관리자 세션 서명에는 `ADMIN_SESSION_SECRET`을 필수로 사용합니다.
- 비밀번호 값이나 입력값은 어떤 환경에서도 로그로 출력하지 않습니다.

예시:

```env
ADMIN_PASSWORD=
ADMIN_VIEWER_PASSWORDS=
ADMIN_SESSION_SECRET=
```

## 세션 설계

- 로그인 성공 시 세션 payload에 만료 시간과 role을 함께 담습니다.
- 세션 role은 `"admin"` 또는 `"viewer"` 중 하나여야 합니다.
- 기존처럼 HMAC 서명으로 payload 전체의 변조를 검증합니다.
- 브라우저 DevTools 등에서 쿠키 payload의 role이나 expiresAt을 직접 수정하면 signature 검증이 실패해 미인증으로 처리되어야 합니다.
- role 값만 별도로 해싱하는 방식은 사용하지 않습니다. 권한 신뢰성은 서버 secret 기반 HMAC signature로 보장합니다.
- 세션 검증 함수는 boolean만 반환하지 말고, 유효한 경우 role 정보를 반환할 수 있어야 합니다.
- 알 수 없는 role, 잘못된 payload, 만료된 세션, 서명 불일치는 모두 미인증으로 처리합니다.

권장 반환 형태:

```ts
type AdminRole = "admin" | "viewer";

type AdminSession =
  | { authenticated: true; role: AdminRole }
  | { authenticated: false };
```

## 서버 권한 경계

- 관리자 페이지 접근에는 `admin`, `viewer` 모두 허용합니다.
- DB 변경 API에는 `admin`만 허용합니다.
- `viewer`가 DB 변경 API를 호출하면 `403 Forbidden`을 반환합니다.
- 세션이 없거나 유효하지 않으면 기존처럼 `401 Unauthorized`를 반환합니다.
- UI 차단은 편의 기능일 뿐이며, DB 변경 차단은 반드시 서버에서 완결합니다.

적용 대상:

- `/api/admin/musics` POST
- `/api/admin/musics/[id]` PUT, DELETE
- `/api/admin/novels` POST
- `/api/admin/novels/[id]` PUT, DELETE
- `/api/admin/comics` POST
- `/api/admin/comics/[id]` PUT, DELETE
- `/api/admin/books` POST
- `/api/admin/books/[id]` PUT, DELETE
- `/api/admin/lyric-tracks` POST
- `/api/admin/lyric-tracks/[musicId]` PUT, DELETE

## 관리자 UI

- `viewer`에서는 생성, 수정, 삭제 진입점을 숨기거나 비활성화합니다.
- 사이드바의 `+ Music`, `+ Novel`, `+ Comic`, `+ Lyric`, `+ Book` 버튼은 `admin`에서만 노출합니다.
- 문서 패널의 수정 버튼, 저장 버튼, 삭제 버튼은 `admin`에서만 노출합니다.
- `viewer`는 기존 문서 필드와 JSON 내용을 읽을 수 있어야 합니다.
- 권한 상태가 헷갈리지 않도록 화면 어딘가에 조회 권한임을 작게 표시해도 됩니다.

## 타임라인 화면

- `admin`, `viewer` 모두 타임라인 화면에 접근할 수 있습니다.
- `viewer`도 YouTube 미리보기, 현재 재생 위치 표시, playhead 이동, ruler 클릭, 라인 선택, 줌, 스크롤 같은 타임라인 인디케이터/탐색 동작은 사용할 수 있어야 합니다.
- `viewer`도 SRT 다운로드 기능은 사용할 수 있어야 합니다.
- `viewer`에서는 DB 저장으로 이어질 수 있는 조작을 막습니다.
- `viewer`에서는 sync 값 변경, 라인 텍스트 편집, start/end 리사이즈, 저장, 되돌리기처럼 draft를 변경하는 조작을 비활성화합니다.
- `viewer`의 SRT export는 원본 lyricTrack 기준으로 동작해야 하며, 저장되지 않은 draft 변경에 의존하지 않도록 합니다.

## 배포 전 정리

- 현재 로컬 테스트용으로 추가된 비밀번호 관련 `console.log`는 제거합니다.
- `.env.example`과 `README.md`에 viewer 환경변수를 추가합니다.
- 기존 쉼표 기반 `ADMIN_PASSWORD` 방식은 제거하고, viewer 다중 비밀번호는 `ADMIN_VIEWER_PASSWORDS`에만 적용합니다.
- 작업 후 `npm run lint`로 검증합니다.

## 확인 시나리오

- `admin` 비밀번호로 로그인하면 모든 생성/수정/삭제와 타임라인 저장이 가능합니다.
- `viewer` 비밀번호 중 하나로 로그인하면 관리자 화면과 타임라인 화면을 볼 수 있습니다.
- `viewer`에서는 생성/수정/삭제 UI가 보이지 않거나 비활성화됩니다.
- `viewer`가 직접 POST/PUT/DELETE API를 호출해도 `403`이 반환됩니다.
- `viewer`는 타임라인에서 재생 위치 확인, 탐색, SRT 다운로드를 사용할 수 있습니다.
- `viewer`는 타임라인 저장, sync 변경, 라인 편집, 리사이즈를 할 수 없습니다.
