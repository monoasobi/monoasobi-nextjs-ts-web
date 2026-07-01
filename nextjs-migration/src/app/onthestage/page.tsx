import { ContentsContainer } from "@components/content/ContentsContainer";
import { OnTheStage } from "@components/custom/OnTheStage";
import { getLyricTrackByMusicId } from "@/server/queries/lyric";
import { getMusicById } from "@/server/queries/music";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function OnTheStagePage() {
  const music = await getMusicById(26);
  if (!music) notFound();

  const lyricTrack = await getLyricTrackByMusicId(music.id);

  return (
    <Suspense>
      <ContentsContainer music={music} lyricTrack={lyricTrack}>
        <OnTheStage />
      </ContentsContainer>
    </Suspense>
  );
}
