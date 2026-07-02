import { ContentsContainer } from "@components/content/ContentsContainer";
import { ComicReader } from "@components/content/ComicReader";
import { getComicById } from "@/server/queries/comic";
import { getLyricTrackByMusicId } from "@/server/queries/lyric";
import { createPageMetadata } from "@lib/metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface ComicPageProps {
  params: Promise<{ id: string }>;
}

export const generateMetadata = async ({
  params,
}: ComicPageProps): Promise<Metadata> => {
  const { id } = await params;
  const comicId = Number(id);
  const data = Number.isInteger(comicId) ? await getComicById(comicId) : null;

  if (!data) {
    return createPageMetadata({
      title: "만화 없음",
      description: "요청하신 만화를 찾을 수 없습니다.",
      path: `/comic/${id}`,
    });
  }

  return createPageMetadata({
    title: data.comic.title,
    description: `${data.music.korTitle} 원작 만화, ${data.comic.writer}의 <${data.comic.title}>`,
    path: `/comic/${data.comic.id}`,
  });
};

export default async function ComicPage({ params }: ComicPageProps) {
  const { id } = await params;
  const comicId = Number(id);
  const data = Number.isInteger(comicId) ? await getComicById(comicId) : null;

  if (!data) notFound();
  const lyricTrack = await getLyricTrackByMusicId(data.music.id);

  return (
    <Suspense>
      <ContentsContainer
        music={data.music}
        lyricTrack={lyricTrack}
        content={data.comic}
      >
        <ComicReader id={data.comic.id} />
      </ContentsContainer>
    </Suspense>
  );
}
