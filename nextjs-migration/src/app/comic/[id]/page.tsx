import { ContentsContainer } from "@components/content/ContentsContainer";
import { ComicReader } from "@components/content/ComicReader";
import { comics } from "@lib/comic";
import { musics } from "@lib/music";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

interface ComicPageProps {
  params: Promise<{ id: string }>;
}

const getComicPageData = (id: string) => {
  const comic = comics.find((item) => item.id === Number(id));
  const music = musics.find((item) => item.id === comic?.musicId);

  if (!comic || !music) return null;

  return { comic, music };
};

export const generateMetadata = async ({
  params,
}: ComicPageProps): Promise<Metadata> => {
  const { id } = await params;
  const data = getComicPageData(id);

  if (!data) {
    return {
      title: "만화 없음 | monoasobi",
    };
  }

  return {
    title: `${data.comic.title} | monoasobi`,
    description: `${data.music.korTitle} 원작 만화`,
  };
};

export default async function ComicPage({ params }: ComicPageProps) {
  const { id } = await params;
  const data = getComicPageData(id);

  if (!data) notFound();

  return (
    <Suspense>
      <ContentsContainer music={data.music} content={data.comic}>
        <ComicReader id={data.comic.id} />
      </ContentsContainer>
    </Suspense>
  );
}
