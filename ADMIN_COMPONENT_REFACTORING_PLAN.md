# Admin Component Refactoring Plan

## 작업 지침

### 커뮤니케이션

- 모든 보고와 설명은 한국어, 존댓말로 작성합니다.
- 직접 코드를 수정한 경우 변경사항은 최대한 간략하게 설명합니다.
- 커밋 메시지는 한글로 1~2줄 이내에서 간결하게 작성합니다.

### 기본 구조 원칙

- 전역 공용 컴포넌트와 route 전용 컴포넌트를 분리합니다.
- 여러 라우트에서 재사용 가능하거나 도메인 표시 단위로 독립적인 컴포넌트는 `src/components`에 둡니다.
- 특정 route의 상태, 데이터 조립, 권한, navigation, API 흐름에 묶인 컴포넌트는 `src/app/**/_components`에 둡니다.
- 관리자 기능은 `/admin` route에 강하게 결합되어 있으므로 `src/app/admin/_components` 아래에 유지합니다.

### 컴포넌트 파일/폴더 컨벤션

- 주체가 되는 컴포넌트 파일은 상위 폴더에 둡니다.
- 보조 파일은 주체 컴포넌트와 같은 이름의 폴더 아래에 둡니다.
- 예시:

```text
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

### 기존 코드 컨벤션

- 페이지/라우트 파일은 얇게 유지합니다.
- 실제 UI 단위는 컴포넌트로 분리합니다.
- 타입, 유틸, 데이터 변환 로직은 UI 컴포넌트와 분리합니다.
- 너무 추상적인 공용화는 피하고, 실제 책임이 분리되는 경우에만 파일을 나눕니다.

### 분리 판단 기준

- 파일 안에 UI 렌더링, form schema, payload 변환, API 호출, 표시 데이터 변환이 함께 있으면 분리 후보로 봅니다.
- 특정 컴포넌트에서만 쓰이는 보조 컴포넌트, 훅, 유틸은 해당 컴포넌트명 폴더 아래에 둡니다.
- 여러 컴포넌트에서 공유될 가능성이 낮으면 `src/components`로 올리지 않습니다.
- `NovelReader`, `ComicReader`, `PurchaseLink`처럼 도메인 표시 단위로 독립적인 컴포넌트는 `src/components/content`에 남깁니다.
- `NovelPageClient`처럼 route 조립, 권한, 라우팅에 묶인 컴포넌트는 `src/app/**/_components`에 둡니다.

## 작업 계획

### 1차 대상: `AdminDocumentPanel.tsx`

가장 크고 책임이 많이 섞여 있으므로 최우선으로 분리합니다.

```text
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

- `AdminDocumentPanel.tsx`에는 선택 문서 계산, 편집 상태, 저장/삭제 흐름, 전체 조립만 남깁니다.
- `adminEditorConfig.ts`에는 editor config, field factory, payload 변환을 둡니다.
- `adminSelectedDocument.ts`에는 읽기 모드 표시용 document 변환을 둡니다.
- `AdminEditorField.tsx`에는 field type별 입력 컴포넌트 렌더링을 둡니다.
- `AdminEditorForm.tsx`에는 form body 렌더링을 둡니다.
- `types.ts`, `utils.ts`로 공통 타입과 작은 헬퍼를 분리합니다.

### 2차 대상: `LyricTimelineEditor.tsx`

기능 폴더는 유지하되 주체 컴포넌트명 폴더를 추가합니다.

```text
src/app/admin/_components/lyric-timeline/
  LyricTimelineEditor.tsx
  LyricTimelineEditor/
    TimelineSidePanel.tsx
    TimelineCanvas.tsx
    TimelineLineBlock.tsx
    TimelineLinePopover.tsx
    useLyricTimelineDraft.ts
    useTimelineResize.ts
    useTimelineZoom.ts
    srt.ts
  TimelineYouTubePreview.tsx
  time.ts
  LyricTimelineEditor.module.css
```

- SRT export, draft 상태, resize/drag, zoom, canvas 렌더링을 단계적으로 분리합니다.

### 3차 대상: `AdminDashboard.tsx`

좌측 트리 UI와 데이터 grouping을 분리합니다.

```text
src/app/admin/_components/
  AdminDashboard.tsx
  AdminDashboard/
    AdminTree.tsx
    AdminTreeButton.tsx
    adminTreeData.ts
    types.ts
```

- `AdminDashboard.tsx`에는 layout, selected node 상태, refresh/logout 정도만 남깁니다.

### 4차 검토 대상: `TimelineYouTubePreview.tsx`

당장 필수는 아니지만 플레이어 제어 로직이 더 늘면 분리합니다.

```text
src/app/admin/_components/lyric-timeline/
  TimelineYouTubePreview.tsx
  TimelineYouTubePreview/
    useTimelineYouTubePlayer.ts
    TimelinePreviewOverlay.tsx
    TimelinePreviewControls.tsx
```

## 검증 계획

- 각 단계 후 TypeScript, ESLint, build를 확인합니다.
- 동작 변경 없이 import 경로와 책임 분리만 하는 것을 원칙으로 합니다.
- 저장, 삭제, 생성, 타임라인 편집처럼 관리자 주요 플로우는 수동 확인 대상으로 둡니다.

