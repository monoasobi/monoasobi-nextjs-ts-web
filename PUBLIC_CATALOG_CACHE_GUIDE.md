# Public Catalog Cache Guide

## 목적

페이지 전환 시 반복되는 DB 조회를 줄이고, 사이드바와 공개 상세 페이지가 같은 공개 카탈로그 데이터를 재사용하도록 정리합니다.

이 작업은 초기 화면 점수보다 사용자가 체감하는 route 전환 텀을 줄이는 데 초점을 둡니다.

## 기본 방향

- 사이드바 전용 조회와 상세 페이지 전용 조회를 분리해서 반복하지 않습니다.
- 공개 페이지에서 공통으로 필요한 `music`, `novel`, `comic`, `lyricTrack` 요약 정보를 하나의 public catalog 조회로 모읍니다.
- 사이드바, `generateMetadata`, 소설/만화/특수 페이지의 summary 조립은 같은 public catalog 캐시를 사용합니다.
- 소설 본문 Markdown, 만화 이미지, 가사 JSON 전체처럼 무거운 콘텐츠는 기존처럼 해당 페이지나 컴포넌트에서 필요할 때 불러옵니다.
- 관리자 API에서 DB를 생성/수정/삭제한 뒤 public catalog 캐시를 명시적으로 revalidate합니다.

## 범위

### 포함

- public catalog 조회 함수 추가
- public catalog 기반 변환 유틸 추가
- 사이드바 조회를 public catalog 기반으로 변경
- 공개 상세 페이지와 `generateMetadata`에서 public catalog 재사용
- 관리자 쓰기 API 성공 후 public catalog 캐시 revalidate
- 필요 시 `novel/[id]`, `comic/[id]` 등에 `loading.tsx` 추가
- 전역 `force-dynamic` 제거 가능성 검토

### 제외

- 마이그레이션 수정
- seed 수정
- 소설 Markdown/R2 저장 구조 변경
- 만화 이미지 로딩 구조 변경
- 가사 timeline JSON 전체를 public catalog에 포함하는 변경
- TanStack Query 도입

## Public Catalog 데이터 원칙

public catalog에는 여러 라우트가 즉시 화면을 구성하는 데 필요한 가벼운 정보만 포함합니다.

포함 후보:

- music id, 제목, 특수 페이지 경로, YouTube id
- novel id, music id, title, writer, origin URL, translator, translated, isPublished, book id
- comic id, music id, title, writer, origin URL, translator, length
- lyricTrack 존재 여부 또는 `musicId` 정도의 최소 정보

제외 대상:

- lyric JSON 전체
- novel Markdown 본문
- comic 이미지 파일 목록이나 이미지 binary
- private-reader 세션에 따라 달라지는 개인화 결과
- admin 전용 편집 payload

## 캐시 정책

기본 TTL은 1시간을 기준으로 합니다.

운영 중 DB 업데이트가 잦지 않으므로 `cacheLife("hours")` 수준이 적절합니다. 업데이트 직후 반영이 필요한 경우에는 관리자 API에서 `revalidateTag`를 호출합니다.

Next.js 16 Cache Components를 채택할 경우:

```ts
import { cacheLife, cacheTag } from "next/cache";

export async function getPublicCatalog() {
  "use cache";
  cacheTag("public-catalog");
  cacheLife("hours");

  return db.query.musics.findMany({
    orderBy: (musics, { asc }) => asc(musics.id),
    with: {
      novels: true,
      comics: true,
      lyricTrack: {
        columns: {
          musicId: true,
        },
      },
    },
  });
}
```

`use cache`, `cacheLife`, `cacheTag`를 쓰려면 `next.config.ts`에 `cacheComponents: true`가 필요합니다.

Route Handler 본문 안에서는 `use cache`를 직접 쓰지 않습니다. 캐시가 필요한 경우 별도 async helper 함수로 분리하고, 그 helper 안에서 `use cache`를 선언합니다.

해당 옵션 영향이 부담되면 `unstable_cache` 기반으로 시작할 수 있습니다. 단, Next.js 16 기준으로 `unstable_cache`는 `use cache`로 대체되는 이전 캐시 모델이므로 장기 방향은 Cache Components로 둡니다.

## Revalidate 원칙

`revalidateTag`는 DB 변경을 자동 감지하지 않습니다. DB 쓰기 성공 후 서버 코드에서 명시적으로 호출해야 합니다.

관리자 API에서 생성/수정/삭제가 성공한 뒤 아래 호출을 추가합니다.

```ts
import { revalidateTag } from "next/cache";

revalidateTag("public-catalog", "max");
```

적용 대상:

- `/api/admin/musics`
- `/api/admin/novels`
- `/api/admin/comics`
- `/api/admin/books`
- `/api/admin/lyric-tracks`

`"max"`는 권장되는 stale-while-revalidate 방식으로 동작합니다. 즉시 모든 페이지를 다시 만들지 않고, 해당 태그를 쓰는 리소스가 다음에 방문될 때 stale 데이터를 제공하면서 백그라운드 갱신을 유도합니다.

DB를 외부 콘솔, 마이그레이션, seed, SQL 클라이언트로 직접 수정하는 경우에는 자동으로 revalidate되지 않습니다. 이번 작업에서는 마이그레이션과 seed는 다루지 않으며, 평소 운영에서는 1시간 TTL 또는 재배포로 충분하다고 봅니다.

## 권장 파일 구조

```txt
src/server/queries/
  publicCatalog.ts
  sidebar.ts
  novel.ts
  comic.ts
```

`publicCatalog.ts` 역할:

- DB에서 공개 카탈로그를 한 번에 조회
- 캐시 태그와 TTL 관리
- catalog에서 sidebar item, novel summary, comic summary를 찾는 helper 제공

예상 helper:

```ts
getPublicCatalog()
getSidebarItems()
getNovelSummaryById(id)
getComicSummaryById(id)
getSpecialPageSummaryByMusicId(musicId)
```

기존 `novel.ts`, `comic.ts`, `music.ts`는 무거운 콘텐츠나 특수 조회가 필요한 경우에만 남깁니다.

## 페이지 적용 원칙

`generateMetadata`와 page component가 같은 summary helper를 사용하게 합니다.

예시:

```ts
export const generateMetadata = async ({ params }: PageProps) => {
  const { id } = await params;
  const data = await getNovelSummaryById(Number(id));
  // metadata 생성
};

export default async function NovelPage({ params }: PageProps) {
  const { id } = await params;
  const data = await getNovelSummaryById(Number(id));
  // 페이지 조립
}
```

이렇게 하면 metadata 생성과 페이지 조립이 같은 public catalog 캐시를 공유합니다.

## 화면 전환 체감 개선

DB 조회 수를 줄이는 것과 별개로, 동적 페이지 전환 시 사용자가 멈춤처럼 느끼지 않도록 route-level loading UI를 둡니다.

우선 검토 대상:

- `src/app/novel/[id]/loading.tsx`
- `src/app/comic/[id]/loading.tsx`
- 특수 페이지 중 DB 조회가 필요한 route

또한 `src/app/layout.tsx`의 전역 `force-dynamic`은 공개 페이지 캐시와 prefetch를 약하게 만들 수 있으므로 제거 가능성을 검토합니다. 동적 처리가 필요한 관리자, private-reader, auth API 쪽에만 동적 설정을 두는 방향을 우선합니다.

## 검증

- 기본 검증은 `npm run lint`로 수행합니다.
- 일상 검증 목적으로 `npm run build`는 실행하지 않습니다.
- 변경 후 브라우저에서 사이드바 클릭 전환, 소설 상세, 만화 상세, 특수 페이지 진입을 수동 확인합니다.
- 관리자 저장 후 public catalog가 최대 1시간 TTL 또는 revalidate 흐름으로 갱신되는지 확인합니다.
