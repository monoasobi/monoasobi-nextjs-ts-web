"use client";

import type { LyricTrack } from "@appTypes/lyric";
import type { Music } from "@appTypes/music";
import type { Novel } from "@appTypes/novel";
import { privateReaderAtom } from "@atoms/privateReader.atom";
import { ContentsContainer } from "@components/content/ContentsContainer";
import { NovelReader } from "@components/content/NovelReader";
import { PurchaseLink } from "@components/content/PurchaseLink";
import { Translate } from "@components/content/Translate";
import { useAtomValue } from "jotai";
import type { PurchaseLinkBook } from "@components/content/PurchaseLink";

interface NovelPageClientProps {
  music: Music;
  novel: Novel;
  lyricTrack: LyricTrack | null;
  purchaseBook: PurchaseLinkBook | null;
}

export const NovelPageClient = ({
  music,
  novel,
  lyricTrack,
  purchaseBook,
}: NovelPageClientProps) => {
  const hasPrivateReaderAccess = useAtomValue(privateReaderAtom);

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
      lyricTrack={lyricTrack}
      content={{
        ...novel,
        translator,
        translatorUrl,
      }}
    >
      {novel.isPublished && !hasPrivateReaderAccess && purchaseBook ? (
        <PurchaseLink book={purchaseBook} />
      ) : !novel.translated ? (
        <Translate originUrl={novel.originUrl} />
      ) : (
        <NovelReader id={novel.id} />
      )}
    </ContentsContainer>
  );
};
