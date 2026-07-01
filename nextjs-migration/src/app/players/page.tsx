import { ContentsContainer } from "@components/content/ContentsContainer";
import { Players } from "@components/custom/Players";
import { getLyricTrackByMusicId } from "@/server/queries/lyric";
import { getMusicById } from "@/server/queries/music";
import { getNovelByMusicId } from "@/server/queries/novel";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

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
