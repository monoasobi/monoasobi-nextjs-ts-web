import { adminAtom } from "@atoms/admin.atom";
import { ContentsContainer } from "@components/layout/ContentsContainer";
import { Loading } from "@components/Loading";
import { PurchaseLink } from "@components/PurchaseLink";
import { Translate } from "@components/Translate";
import { musics } from "@lib/music";
import { novels } from "@lib/novel";
import { useAtomValue } from "jotai";
import { lazy, Suspense, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const Reader = lazy(() =>
  import("@components/NovelReader").then(({ NovelReader }) => ({
    default: NovelReader,
  }))
);

export const Novel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const novel = novels.find((novel) => novel.id === Number(id));
  const music = musics.find((music) => music.id === novel?.musicId);
  useEffect(() => {
    if (!music || !novel) navigate("/404");
  }, [music, navigate, novel]);

  const isAdmin = useAtomValue(adminAtom);
  if (!music || !novel) return;

  const translator =
    !novel.isPublished || isAdmin
      ? novel.translated
        ? novel.translator
        : ""
      : "";
  const translatorUrl =
    !novel.isPublished || isAdmin
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
      {novel.isPublished && !isAdmin ? (
        <PurchaseLink bookId={novel.bookId} />
      ) : !novel.translated ? (
        <Translate music={music} />
      ) : (
        <Suspense fallback={<Loading />}>
          <Reader id={novel.id} />
        </Suspense>
      )}
    </ContentsContainer>
  );
};
