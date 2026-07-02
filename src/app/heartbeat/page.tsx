import { HeartBeat } from "@components/custom/HeartBeat";
import { ContentsContainer } from "@components/content/ContentsContainer";
import { getLyricTrackByMusicId } from "@/server/queries/lyric";
import { getMusicById } from "@/server/queries/music";
import { getNovelByMusicId } from "@/server/queries/novel";
import { createPageMetadata } from "@lib/metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const generateMetadata = async (): Promise<Metadata> => {
  const music = await getMusicById(24);
  const title = music?.korTitle ?? "HEART BEAT";

  return createPageMetadata({
    title,
    description: `${title} 특별 페이지와 가사를 감상하는 공간`,
    path: "/heartbeat",
  });
};

export default async function HeartBeatPage() {
  const music = await getMusicById(24);
  if (!music) notFound();

  const [novel, lyricTrack] = await Promise.all([
    getNovelByMusicId(music.id),
    getLyricTrackByMusicId(music.id),
  ]);

  return (
    <Suspense>
      <ContentsContainer
        music={music}
        lyricTrack={lyricTrack}
        content={novel?.novel}
      >
        <HeartBeat />
      </ContentsContainer>
    </Suspense>
  );
}
