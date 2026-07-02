# Lyric Timeline Editor 작업 지침

## 목적

기존 가사 플레이어는 `lyric_tracks.sync`와 `lyric_tracks.lyric_json`을 이용해 YouTube 영상 시간에 맞춰 가사를 출력한다. 이 문서는 `/admin`에서 가사 싱크와 각 라인의 시작/종료 시간을 프리미어 프로 타임라인처럼 시각적으로 조정하는 편집 기능을 만들기 위한 초기 설계 지침이다.

초기 목표는 별도 데이터 모델을 크게 늘리지 않고, `/admin`에서 전용 타임라인 편집 페이지로 이동해 안전한 시각 편집 레이어를 제공하는 것이다.

## 현재 구조 요약

- 가사 데이터 타입: `src/types/lyric.d.ts`
- 재생 UI: `src/components/common/YouTubeLyricsPlayer.tsx`
- YouTube 플레이어: `src/components/common/VideoPlayer.tsx`
- 어드민 화면: `src/app/admin/_components/AdminDashboard.tsx`, `src/app/admin/_components/AdminDocumentPanel.tsx`
- 저장 API: `src/app/api/admin/lyric-tracks/route.ts`, `src/app/api/admin/lyric-tracks/[musicId]/route.ts`
- DB 필드: `lyric_tracks.music_id`, `sync`, `lyric_json`

현재 `lyric_json`은 `LyricLine[]` 형태이며, 각 라인은 아래 구조를 가진다.

```ts
interface LyricLine {
  start: number;
  end: number;
  jp: string;
  kr: string;
  jpReading: string;
  callType?: "LOUD" | "CLAP" | "CUSTOM";
  callGuide?: string;
}
```

## 권장 구현 방향

### 1. MVP 범위

첫 버전은 기존 `/admin` lyricTrack 문서 패널 안에서 직접 편집하지 않고, 넓은 작업 공간을 가진 전용 페이지에서 Timeline 편집을 제공한다.

- 기존 `/admin` lyricTrack 폼에는 `Timeline 편집` 진입 버튼을 추가한다.
- 전용 페이지 경로는 예를 들어 `/admin/lyrics/[musicId]/timeline` 형태를 사용한다.
- Timeline 페이지는 서버에서 music과 lyricTrack을 조회하고, 클라이언트 편집 컴포넌트에 초기값으로 전달한다.
- 기존 JSON textarea는 고급 편집 fallback으로 유지하되, Timeline 편집은 폼 내부 탭으로 넣지 않는다.
- 저장은 기존 `PUT /api/admin/lyric-tracks/[musicId]`를 그대로 사용한다.
- DB 스키마 변경은 하지 않는다.
- `sync` 값은 Timeline 페이지에서 수정할 수 있고, 변경 즉시 미리보기 재생/가사 싱크에 반영한다.
- `sync` 변경을 각 라인의 `start/end`에 자동 적용하지 않는다.
- 편집 화면의 가사 블록 위치는 가사 기준 오프셋인 `sync`를 적용해 `line.start + sync`, `line.end + sync`로 표시한다.
- UI 구성은 Radix UI와 현재 프로젝트에서 사용하는 `@radix-ui/themes`를 최대한 활용한다.
- 작은 화면에서는 본격 편집이 어렵기 때문에 읽기/미리보기 또는 화면 확대 안내를 제공하고, 핵심 타임라인 조정은 충분한 폭의 화면에서만 활성화한다.

이렇게 하면 기존 수동 JSON 편집 방식을 fallback으로 유지하면서, 타임라인 작업에 필요한 화면 폭과 조작 공간을 확보할 수 있다.

### 2. 화면 구성

권장 레이아웃은 아래와 같다.

- 상단: `/admin`으로 돌아가기, 곡 제목, 전체 싱크 오프셋, 저장 상태
- 좌측 또는 상단 고정 영역: YouTube 프리뷰 플레이어
- 중앙: 타임라인 편집 영역
- 선택 블록 기준 위치: 선택한 가사 라인 편집 Popover

타임라인 영역은 다음 요소를 포함한다.

- 시간 눈금: 0초부터 영상 길이까지 표시
- 재생 헤드: 현재 YouTube 재생 위치를 세로선으로 표시
- 가사 블록: 각 `LyricLine`을 `start`~`end` 구간에 맞춰 배치
- 줌 컨트롤: 초당 픽셀 비율을 조정
- 스크롤: 긴 곡을 가로 스크롤로 탐색
- 라인 편집: Radix Popover 기반의 간단한 편집 화면

## 타임라인 인터랙션

### 가사 블록 표시

- 블록의 표시 시작 시간은 `line.start + sync`이다.
- 블록의 표시 종료 시간은 `line.end + sync`이다.
- 블록의 `left`는 `(line.start + sync) * pixelsPerSecond`
- 블록의 `width`는 `((line.end + sync) - (line.start + sync)) * pixelsPerSecond`이며, 결과적으로 `(line.end - line.start) * pixelsPerSecond`와 같다.
- 블록의 메인 라벨은 `jpReading`을 우선으로 표시한다.
- 블록의 서브 라벨은 `kr`을 표시한다.
- `jpReading`이 비어 있으면 `jp`, `kr`, 라인 번호 순서로 fallback한다.
- 너무 짧은 블록은 최소 너비를 둔다. 단, 실제 `start/end` 값은 최소 너비 때문에 바꾸지 않는다.
- 겹친 블록은 허용하지 않는다.

### 시작/종료 핸들 조정

초기 버전에서는 블록 자체 이동을 지원하지 않는다. 사용자는 각 블록의 좌우 핸들을 조정해 `start`와 `end`를 변경한다.

좌우 핸들은 외부 DnD 라이브러리 없이 Pointer Events로 구현하는 편을 권장한다. 현재 프로젝트에는 DnD 전용 의존성이 없고, 타임라인은 수평 위치를 시간으로 변환하는 도메인 로직이 핵심이기 때문이다.

핸들 이동 규칙:

- 시간 변화량: `deltaPx / pixelsPerSecond`
- 스냅 단위: 기본 `0.01s` 또는 `0.05s`
- 음수 시간 방지: `start >= 0`
- 이전/다음 라인과 겹치지 않도록 인접 라인의 경계도 함께 조정한다.
- 예: 현재 라인의 `start`를 앞으로 당겨 이전 라인과 겹치게 될 경우, 이전 라인의 `end`를 현재 라인의 `start` 이하로 맞춘다.
- 예: 현재 라인의 `end`를 뒤로 밀어 다음 라인과 겹치게 될 경우, 다음 라인의 `start`를 현재 라인의 `end` 이상으로 맞춘다.
- 최소 길이: `0.1s`
- `start < end` 불변식 유지
- 인접 라인에 영향을 줄 수 있음을 UI에서 명확히 보여준다.

### 블록 클릭 편집

블록을 클릭하면 Radix Popover 기반 편집 화면을 연다.

편집 필드:

- `start`
- `end`
- `jp`
- `kr`
- `jpReading`
- `callType`
- `callGuide`

권장 UX:

- 텍스트와 시간 수정은 Radix Popover 안에서 처리한다.
- 별도 우측 고정 패널은 MVP에 포함하지 않는다.
- 값 변경 시 즉시 로컬 상태에 반영하고, 저장 버튼으로 서버에 반영한다.
- `start/end` 직접 입력과 핸들 조정 결과는 같은 업데이트 함수를 사용한다.
- Popover는 Radix의 collision handling을 활용해 타임라인 가장자리에서도 화면 밖으로 벗어나지 않게 한다.

### 분할 기능

신규 라인 추가 대신 선택한 블록을 분할하는 기능을 제공한다.

- 분할 기준은 현재 재생 시간 또는 선택 블록 안에서 지정한 시간이다.
- 분할 시간은 `start < splitTime < end`를 만족해야 한다.
- 기존 라인은 `start`~`splitTime`, 새 라인은 `splitTime`~`end`로 나눈다.
- 새 라인의 텍스트는 기존 라인 값을 복사한 뒤 Popover에서 바로 수정할 수 있게 한다.
- 분할 후에도 블록 겹침은 허용하지 않는다.

### 타임라인 확대/축소

타임라인은 확대/축소를 지원해야 한다. 확대/축소는 `pixelsPerSecond` 값을 조정해 구현한다.

- `Cmd + +`: 타임라인 확대
- `Cmd + -`: 타임라인 축소
- `Cmd + wheel scroll`: 커서 위치를 기준으로 부드럽게 확대/축소
- 화면에 보이는 중심 시간 또는 커서 아래의 시간이 줌 전후에 최대한 유지되도록 `scrollLeft`를 보정한다.
- 최소/최대 줌 범위를 둔다. 예: `20px/s`~`300px/s`
- 줌 단계는 버튼/키보드 입력에서는 일정 비율로 증가/감소하고, 휠 입력에서는 `deltaY`를 이용해 연속적으로 반영한다.
- 입력 필드나 textarea에 포커스가 있을 때는 `Cmd + +`, `Cmd + -`를 가로채지 않는다.
- 브라우저 기본 페이지 확대/축소와 충돌하지 않도록 Timeline 영역에 포커스가 있거나 포인터가 올라와 있을 때만 처리한다.

## YouTube 재생 연동

Timeline 편집기는 기존 `VideoPlayer`의 제어 기능을 확장하거나 별도 admin용 플레이어 컴포넌트를 만든다.

필요한 기능:

- 현재 시간 읽기
- 특정 시간으로 seek
- 재생/일시정지
- duration 읽기
- 타임라인 재생 헤드 업데이트

현재 `VideoPlayerHandle`은 `seekAndPlay(time)`만 제공한다. admin용으로는 다음 중 하나를 선택한다.

- `VideoPlayer` handle에 `seek(time)`, `play()`, `pause()`, `getCurrentTime()`을 추가
- 기존 감상용 UI와 분리된 `AdminYouTubePreview` 컴포넌트 생성

감상용 플레이어와 편집용 플레이어의 UI 요구가 다르므로, MVP 이후에는 admin 전용 컴포넌트 분리를 권장한다.

## 시간 계산 원칙

시간 값은 초 단위 number로 유지한다.

- 시간 정밀도는 현재 사용하는 `react-player`에서 실제로 안정적으로 제공하는 범위 안으로 제한한다.
- `react-player` 문서 또는 타입에서 명확한 제한을 확인할 수 없으면, 현재 가사 데이터와 동일하게 소수점 둘째 자리 단위인 `0.01s`를 사용한다.
- 저장 전에는 결정된 정밀도에 맞춰 정규화한다.
- `sync`는 영상 기준 오프셋이 아니라 가사 기준 오프셋으로 취급한다.
- `sync` 수정은 편집 화면의 모든 가사 블록 표시 시간에 즉시 반영한다.
- 예: `sync`가 `+0.1`이면 화면에 표시되는 모든 블록의 시작/종료 시간이 `line.start + 0.1`, `line.end + 0.1`이 된다.
- `sync` 값을 수정해도 `line.start/end` 값은 자동으로 이동하거나 변환하지 않는다.
- 각 `line.start/end`는 파일에 저장되는 원본 가사 시간으로 취급한다.

중요한 구분:

- `sync`: 전체 가사 표시 오프셋이며 별도 필드로 저장한다.
- `line.start/end` 변경: 실제 lyric JSON 자체의 싱크를 수정하는 용도

Timeline 에디터는 `sync`와 `line.start/end`를 모두 편집할 수 있지만, 둘을 자동으로 서로 변환하지 않는다.
화면 표시와 재생 미리보기에는 `sync`가 적용된 표시 시간을 사용하고, 저장 payload에는 원본 `sync`, `start`, `end` 값을 각각 유지한다.

## 데이터 검증

저장 전 클라이언트와 서버 양쪽에서 최소 검증을 추가한다.

권장 검증:

- `lyricJson`은 배열이어야 한다.
- 각 라인은 `start`, `end`, `jp`, `kr`, `jpReading`을 가진다.
- `start`와 `end`는 유한한 number여야 한다.
- `start >= 0`
- `end > start`
- 인접 라인과 시간이 겹치지 않아야 한다.
- 빈 문자열은 허용할 수 있으나 필드 자체는 유지한다.
- `callType`은 지정된 값만 허용한다.

현재 `lyricTrackSchema`는 `lyricJson: z.unknown()`이라 구조 검증이 약하다. Timeline 편집기를 만들 때는 `lyricLineSchema`를 추가해 서버 저장 단계에서 구조를 검증하는 것이 좋다.

## 컴포넌트 초안

권장 파일 구성:

```txt
src/app/admin/_components/lyric-timeline/
  LyricTimelineEditor.tsx
  LyricTimelineEditor.module.css
  TimelineRuler.tsx
  TimelineTrack.tsx
  LyricBlock.tsx
  LyricLinePopover.tsx
  time.ts
  validation.ts
```

주요 책임:

- `LyricTimelineEditor`: 전체 상태, 플레이어 연동, 저장 payload 생성
- `TimelineRuler`: 시간 눈금 렌더링
- `TimelineTrack`: 스크롤/줌/재생 헤드/블록 배치
- `LyricBlock`: 블록 선택, 좌우 핸들 조정, Popover trigger 처리
- `LyricLinePopover`: 라인 텍스트와 시간 직접 편집
- `time.ts`: px/time 변환, 반올림, 클램프
- `validation.ts`: lyric line 검증

## 상태 관리

초기에는 `useState`와 `useMemo`로 충분하다.

관리할 상태:

- `draftLyrics: LyricLine[]`
- `draftSync: number`
- `selectedLineIndex: number | null`
- `currentTime: number`
- `duration: number`
- `pixelsPerSecond: number`
- `timelineScrollLeft: number`
- `dirty: boolean`

변경 함수는 한곳에 모은다.

```ts
updateLine(index, patch)
updateSync(nextSync)
resizeLineStart(index, nextStart)
resizeLineEnd(index, nextEnd)
splitLine(index, splitTime)
zoomTimeline(nextPixelsPerSecond, anchorTime)
```

## 저장 UX

- 저장 전 `dirty` 상태를 표시한다.
- 저장 성공 시 현재 Timeline 페이지 데이터를 갱신하고, `/admin`으로 돌아갔을 때 최신 데이터가 보이도록 한다.
- 저장 실패 시 API 오류 메시지를 보여준다.
- Timeline 전용 페이지는 서버에서 받은 `lyricJson`을 typed draft로 변환해 사용한다.
- Timeline 전용 페이지는 서버에서 받은 `sync`를 `draftSync`로 관리하고, 변경 즉시 블록 표시 시간과 미리보기 싱크 계산에 반영한다.
- `draftSync` 저장은 `sync` 필드만 바꾸며, `draftLyrics`의 `start/end`에 자동 적용하지 않는다.
- 기존 `/admin` JSON 폼에서 Timeline 페이지로 이동할 때는 저장된 서버 데이터를 기준으로 열린다는 점을 명확히 한다.
- 사용자가 기존 JSON 폼에서 저장하지 않은 변경을 가진 상태라면, Timeline 편집 진입 전에 저장을 유도하거나 경고한다.

## 접근성 및 조작 보조

키보드 조작은 최소화한다. 단축키는 input/textarea 포커스 중에는 동작하지 않게 한다.

권장 단축키:

- `Space`: 재생/일시정지
- `Enter`: 선택 블록 편집 열기
- `Cmd + +`: 타임라인 확대
- `Cmd + -`: 타임라인 축소
- `Cmd + wheel scroll`: 타임라인 확대/축소

화살표 키나 `Esc` 등 추가 단축키는 MVP에 포함하지 않는다. 미세 조정은 Popover의 숫자 입력 또는 타임라인 핸들 조정으로 처리한다. `Cmd + +`, `Cmd + -`, `Cmd + wheel scroll`은 타임라인 탐색에 필요한 줌 조작 예외로 둔다.

## 라이브러리 사용 원칙

- Radix UI와 `@radix-ui/themes`를 최대한 활용한다.
- 라인 편집은 Radix Popover, 보조 설명은 Radix Tooltip, 긴 영역은 Radix ScrollArea를 우선 검토한다.
- 화면 안에 모드 전환이 꼭 필요할 때만 Radix Tabs를 사용하며, Timeline 편집 자체를 기존 폼 내부 탭으로 구성하지 않는다.
- 라이브러리와 관련된 구현을 할 때는 항상 Context7 MCP를 먼저 사용해 현재 문서와 API를 확인한다.
- Context7에서 해당 라이브러리를 찾을 수 없으면, 로컬 패키지 타입과 공식 문서를 확인하고 그 사실을 작업 기록에 남긴다.

## 구현 단계

1. `lyricLineSchema`와 lyric JSON 검증 함수 추가
2. `/admin` lyricTrack 폼에 Timeline 전용 페이지 진입 버튼 추가
3. `/admin/lyrics/[musicId]/timeline` 전용 페이지와 데이터 조회 흐름 추가
4. `LyricTimelineEditor` 기본 레이아웃 추가
5. 시간 눈금, 재생 헤드, 가사 블록 렌더링
6. `Cmd + +`, `Cmd + -`, `Cmd + wheel scroll` 기반 타임라인 확대/축소 구현
7. 좌우 핸들 기반 `start/end` 조정 구현
8. 블록 클릭 Popover 편집 구현
9. YouTube seek/play 연동
10. `sync` 편집 UI와 즉시 미리보기 반영 구현
11. 저장/오류/dirty 상태 연결
12. 블록 분할 기능 구현
13. 겹침 방지와 잘못된 시간 입력 차단
14. 작은 화면 편집 제한과 안내 UI 정리

## 테스트 기준

최소 확인 항목:

- 기존 JSON 편집 저장이 계속 동작한다.
- `/admin` lyricTrack 폼에서 Timeline 전용 페이지로 이동할 수 있다.
- Timeline 전용 페이지를 새로고침해도 서버 데이터로 정상 초기화된다.
- Timeline에서 좌우 핸들을 조정하면 해당 라인의 `start/end`가 변경된다.
- 핸들 조정으로 인접 라인과 겹칠 상황에서는 인접 라인의 경계가 함께 조정되어 겹침이 생기지 않는다.
- 블록 클릭 후 가사 텍스트를 수정할 수 있다.
- 블록에는 독음이 메인으로, 한글 가사가 서브로 표시된다.
- 저장 후 새로고침해도 변경 사항이 유지된다.
- `sync`를 수정하면 모든 블록의 표시 위치와 미리보기 가사 싱크에 즉시 반영된다.
- `sync`가 `+0.1`일 때 `start: 10`, `end: 12` 라인은 UI에서 `10.1`~`12.1` 위치에 표시된다.
- `sync`를 수정해도 각 라인의 `start/end` 값은 자동으로 바뀌지 않는다.
- 저장 후 새로고침하면 수정한 `sync` 값이 유지된다.
- 현재 재생 시간이 재생 헤드에 반영된다.
- 재생 헤드를 클릭하거나 블록을 클릭했을 때 YouTube가 해당 시간으로 이동한다.
- `Cmd + +`, `Cmd + -`, `Cmd + wheel scroll`로 타임라인을 확대/축소할 수 있다.
- 확대/축소 후에도 보고 있던 시간대가 갑자기 화면 밖으로 밀려나지 않는다.
- 잘못된 `start/end` 값은 저장 전에 막힌다.
- 선택한 블록을 분할할 수 있고, 분할 후에도 시간이 겹치지 않는다.

## 확정된 정책

- 블록 이동은 기본 지원하지 않는다.
- 블록 겹침은 허용하지 않는다.
- `sync`는 가사 기준 오프셋이며 수정 가능하다.
- `sync`는 모든 블록의 UI 표시 시간에 즉시 더해서 적용한다.
- `sync` 수정은 각 라인의 `start/end`에 자동 적용하지 않는다.
- 라인 편집은 Popover만으로 처리한다.
- 신규 라인 추가 대신 분할 기능을 제공한다.
- Timeline 편집은 기존 폼 내부가 아니라 전용 페이지에서 처리한다.
- 작은 화면에서는 타임라인 조정 작업을 제한하고 충분한 화면 폭을 안내한다.
- 타임라인은 `Cmd + +`, `Cmd + -`, `Cmd + wheel scroll`로 확대/축소할 수 있어야 한다.
- YouTube duration을 못 읽는 경우의 fallback 길이를 어떻게 잡을지 정해야 한다.
