import { ContentsContainer } from "@components/content/ContentsContainer";
import { OnTheStage } from "@components/custom/OnTheStage";
import { musics } from "@lib/music";
import { Suspense } from "react";

export default function OnTheStagePage() {
  const music = musics[26];

  return (
    <Suspense>
      <ContentsContainer music={music}>
        <OnTheStage />
      </ContentsContainer>
    </Suspense>
  );
}
