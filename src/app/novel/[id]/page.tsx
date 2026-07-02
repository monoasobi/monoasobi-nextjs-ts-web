import { getBookPurchaseInfoById } from "@/server/queries/book";
import { getLyricTrackByMusicId } from "@/server/queries/lyric";
import { getNovelById } from "@/server/queries/novel";
import { createPageMetadata } from "@lib/metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NovelPageClient } from "./_components/NovelPageClient";

interface NovelPageProps {
  params: Promise<{ id: string }>;
}

export const generateMetadata = async ({
  params,
}: NovelPageProps): Promise<Metadata> => {
  const { id } = await params;
  const novelId = Number(id);
  const data = Number.isInteger(novelId) ? await getNovelById(novelId) : null;

  if (!data) {
    return createPageMetadata({
      title: "소설 없음",
      description: "요청하신 소설을 찾을 수 없습니다.",
      path: `/novel/${id}`,
    });
  }

  return createPageMetadata({
    title: `<${data.novel.title}>`,
    description: `${data.music.korTitle} 원작 소설, ${data.novel.writer}의 <${data.novel.title}>`,
    path: `/novel/${data.novel.id}`,
  });
};

export default async function NovelPage({ params }: NovelPageProps) {
  const { id } = await params;
  const novelId = Number(id);
  const data = Number.isInteger(novelId) ? await getNovelById(novelId) : null;

  if (!data) notFound();

  const [lyricTrack, purchaseBook] = await Promise.all([
    getLyricTrackByMusicId(data.music.id),
    data.novel.isPublished
      ? getBookPurchaseInfoById(data.novel.bookId)
      : Promise.resolve(null),
  ]);

  return (
    <NovelPageClient
      music={data.music}
      novel={data.novel}
      lyricTrack={lyricTrack}
      purchaseBook={purchaseBook}
    />
  );
}
