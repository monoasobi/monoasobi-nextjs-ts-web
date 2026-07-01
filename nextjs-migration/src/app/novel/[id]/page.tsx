import { getBookPurchaseInfoById } from "@/server/queries/book";
import { getLyricTrackByMusicId } from "@/server/queries/lyric";
import { getNovelById } from "@/server/queries/novel";
import { notFound } from "next/navigation";
import { NovelPageClient } from "./_components/NovelPageClient";

interface NovelPageProps {
  params: Promise<{ id: string }>;
}

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
