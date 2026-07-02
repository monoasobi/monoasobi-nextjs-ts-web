import { ContentsContainer } from "@components/content/ContentsContainer";
import { Players } from "@components/custom/Players";
import { getLyricTrackByMusicId } from "@/server/queries/lyric";
import { getMusicById } from "@/server/queries/music";
import { getNovelByMusicId } from "@/server/queries/novel";
import { createPageMetadata } from "@lib/metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const generateMetadata = async (): Promise<Metadata> => {
  const music = await getMusicById(29);
  const title = music?.korTitle ?? "群青";

  return createPageMetadata({
    title,
    description: `${title} 원작 콘텐츠와 가사를 감상하는 공간`,
    path: "/players",
  });
};

export default async function PlayersPage() {
  const music = await getMusicById(29);
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
        <Players />
      </ContentsContainer>
    </Suspense>
  );
}
