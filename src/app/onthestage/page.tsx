import { ContentsContainer } from "@components/content/ContentsContainer";
import { OnTheStage } from "@components/custom/OnTheStage";
import { getLyricTrackByMusicId } from "@/server/queries/lyric";
import { getMusicById } from "@/server/queries/music";
import { createPageMetadata } from "@lib/metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const generateMetadata = async (): Promise<Metadata> => {
  const music = await getMusicById(26);
  const title = music?.korTitle ?? "On The Stage";

  return createPageMetadata({
    title,
    description: `${title} 특별 페이지와 가사를 감상하는 공간`,
    path: "/onthestage",
  });
};

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
