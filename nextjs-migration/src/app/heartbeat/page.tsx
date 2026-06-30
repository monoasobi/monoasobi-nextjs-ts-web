import { HeartBeat } from "@components/custom/HeartBeat";
import { ContentsContainer } from "@components/content/ContentsContainer";
import { musics } from "@lib/music";
import { novels } from "@lib/novel";
import { Suspense } from "react";

export default function HeartBeatPage() {
  const music = musics[24];
  const novel = novels.find((item) => item.musicId === music.id);

  return (
    <Suspense>
      <ContentsContainer music={music} content={novel}>
        <HeartBeat />
      </ContentsContainer>
    </Suspense>
  );
}
