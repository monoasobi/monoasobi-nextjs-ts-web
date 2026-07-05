import { ContentsContainer } from "@components/content/ContentsContainer";
import { Players } from "@components/custom/Players";
import { getLyricTrackByMusicId } from "@/server/queries/lyric";
import { getSpecialPageSummaryByMusicId } from "@/server/queries/publicCatalog";
import { createPageMetadata } from "@lib/metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

const PLAYERS_MUSIC_ID = 29;

export const generateMetadata = async (): Promise<Metadata> => {
  const data = await getSpecialPageSummaryByMusicId(PLAYERS_MUSIC_ID);
  const title = data?.music.korTitle ?? "群青";

  return createPageMetadata({
    title,
    description: `${title} 원작 콘텐츠와 가사를 감상하는 공간`,
    path: "/players",
  });
};

export default async function PlayersPage() {
  const data = await getSpecialPageSummaryByMusicId(PLAYERS_MUSIC_ID);
  if (!data) notFound();

  const lyricTrack = await getLyricTrackByMusicId(data.music.id);

  return (
    <Suspense>
      <ContentsContainer
        music={data.music}
        lyricTrack={lyricTrack}
        content={data.novel}
      >
        <Players />
      </ContentsContainer>
    </Suspense>
  );
}
