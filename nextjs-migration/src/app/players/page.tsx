import { ContentsContainer } from "@components/content/ContentsContainer";
import { Players } from "@components/custom/Players";
import { musics } from "@lib/music";
import { novels } from "@lib/novel";
import { Suspense } from "react";

export default function PlayersPage() {
  const music = musics[29];
  const novel = novels.find((item) => item.musicId === music.id);

  return (
    <Suspense>
      <ContentsContainer music={music} content={novel}>
        <Players />
      </ContentsContainer>
    </Suspense>
  );
}
