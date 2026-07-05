import { ContentsContainer } from "@components/content/ContentsContainer";
import { OnTheStage } from "@components/custom/OnTheStage";
import { getLyricTrackByMusicId } from "@/server/queries/lyric";
import { getSpecialPageSummaryByMusicId } from "@/server/queries/publicCatalog";
import { createPageMetadata } from "@lib/metadata";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

const ON_THE_STAGE_MUSIC_ID = 26;

export const generateMetadata = async (): Promise<Metadata> => {
  const data = await getSpecialPageSummaryByMusicId(ON_THE_STAGE_MUSIC_ID);
  const title = data?.music.korTitle ?? "On The Stage";

  return createPageMetadata({
    title,
    description: `${title} 특별 페이지와 가사를 감상하는 공간`,
    path: "/onthestage",
  });
};

export default async function OnTheStagePage() {
  const data = await getSpecialPageSummaryByMusicId(ON_THE_STAGE_MUSIC_ID);
  if (!data) notFound();

  const lyricTrack = await getLyricTrackByMusicId(data.music.id);

  return (
    <Suspense>
      <ContentsContainer music={data.music} lyricTrack={lyricTrack}>
        <OnTheStage />
      </ContentsContainer>
    </Suspense>
  );
}
