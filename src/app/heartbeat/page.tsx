import { HeartBeat } from "@components/custom/HeartBeat";
import { ContentsContainer } from "@components/content/ContentsContainer";
import { getLyricTrackByMusicId } from "@/server/queries/lyric";
import { getSpecialPageSummaryByMusicId } from "@/server/queries/publicCatalog";
import { createPageMetadata } from "@lib/metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

const HEARTBEAT_MUSIC_ID = 24;

export const generateMetadata = async (): Promise<Metadata> => {
  const data = await getSpecialPageSummaryByMusicId(HEARTBEAT_MUSIC_ID);
  const title = data?.music.korTitle ?? "HEART BEAT";

  return createPageMetadata({
    title,
    description: `${title} 특별 페이지와 가사를 감상하는 공간`,
    path: "/heartbeat",
  });
};

export default async function HeartBeatPage() {
  const data = await getSpecialPageSummaryByMusicId(HEARTBEAT_MUSIC_ID);
  if (!data) notFound();

  const lyricTrack = await getLyricTrackByMusicId(data.music.id);

  return (
    <Suspense>
      <ContentsContainer
        music={data.music}
        lyricTrack={lyricTrack}
        content={data.novel}
      >
        <HeartBeat />
      </ContentsContainer>
    </Suspense>
  );
}
