"use client";

import { privateReaderAtom } from "@atoms/privateReader.atom";
import { ContentsContainer } from "@components/content/ContentsContainer";
import { NovelReader } from "@components/content/NovelReader";
import { PurchaseLink } from "@components/content/PurchaseLink";
import { Translate } from "@components/content/Translate";
import { musics } from "@lib/music";
import { novels } from "@lib/novel";
import { useAtomValue } from "jotai";

interface NovelPageClientProps {
  id: number;
}

export const NovelPageClient = ({ id }: NovelPageClientProps) => {
  const novel = novels.find((novel) => novel.id === id);
  const music = musics.find((music) => music.id === novel?.musicId);
  const hasPrivateReaderAccess = useAtomValue(privateReaderAtom);

  if (!music || !novel) return null;

  const translator =
    !novel.isPublished || hasPrivateReaderAccess
      ? novel.translated
        ? novel.translator
        : ""
      : "";
  const translatorUrl =
    !novel.isPublished || hasPrivateReaderAccess
      ? novel.translated
        ? novel.translatorUrl
        : ""
      : "";

  return (
    <ContentsContainer
      music={music}
      content={{
        ...novel,
        translator,
        translatorUrl,
      }}
    >
      {novel.isPublished && !hasPrivateReaderAccess ? (
        <PurchaseLink bookId={novel.bookId} />
      ) : !novel.translated ? (
        <Translate music={music} />
      ) : (
        <NovelReader id={novel.id} />
      )}
    </ContentsContainer>
  );
};
