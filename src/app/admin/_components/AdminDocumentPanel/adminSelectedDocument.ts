import type { AdminDashboardData, SelectedNode } from "../AdminDashboard";
import type { DocumentField, SelectedDocument } from "./types";

export const getSelectedDocument = (
  data: AdminDashboardData,
  selectedNode: SelectedNode,
): SelectedDocument => {
  if (selectedNode.type === "newMusic") {
    return emptyDocument("musics", "Create music");
  }

  if (selectedNode.type === "newNovel") {
    const music = data.musics.find((item) => item.id === selectedNode.musicId);
    return emptyDocument("novels", `Create novel for ${music?.title ?? ""}`);
  }

  if (selectedNode.type === "newComic") {
    const music = data.musics.find((item) => item.id === selectedNode.musicId);
    return emptyDocument("comics", `Create comic for ${music?.title ?? ""}`);
  }

  if (selectedNode.type === "newLyric") {
    const music = data.musics.find((item) => item.id === selectedNode.musicId);
    return emptyDocument(
      "lyric_tracks",
      `Create lyricTrack for ${music?.title ?? ""}`,
    );
  }

  if (selectedNode.type === "newBook") {
    return emptyDocument("books", "Create book");
  }

  if (selectedNode.type === "music") {
    const music = data.musics.find((item) => item.id === selectedNode.id);
    return {
      collection: "musics",
      title: music ? `${music.id}: ${music.title}` : "Unknown music",
      fields: toFields([
        ["id", music?.id],
        ["title", music?.title],
        ["korTitle", music?.korTitle],
        ["enTitle", music?.enTitle],
        ["youtubeId", music?.youtubeId],
        ["specialPath", music?.specialPath ?? null],
      ]),
    };
  }

  if (selectedNode.type === "novel") {
    const novel = data.novels.find((item) => item.id === selectedNode.id);
    return {
      collection: "novels",
      title: novel ? `${novel.id}: ${novel.title}` : "Unknown novel",
      fields: toFields([
        ["id", novel?.id],
        ["musicId", novel?.musicId],
        ["music", novel?.music?.title],
        ["bookId", novel?.bookId ?? null],
        ["book", novel?.book?.name ?? null],
        ["title", novel?.title],
        ["writer", novel?.writer],
        ["originUrl", novel?.originUrl],
        ["translated", novel?.translated],
        ["translator", novel?.translator ?? null],
        ["translatorUrl", novel?.translatorUrl ?? null],
        ["isPublished", novel?.isPublished],
      ]),
    };
  }

  if (selectedNode.type === "comic") {
    const comic = data.comics.find((item) => item.id === selectedNode.id);
    return {
      collection: "comics",
      title: comic ? `${comic.id}: ${comic.title}` : "Unknown comic",
      fields: toFields([
        ["id", comic?.id],
        ["musicId", comic?.musicId],
        ["music", comic?.music?.title],
        ["title", comic?.title],
        ["writer", comic?.writer],
        ["originUrl", comic?.originUrl],
        ["translator", comic?.translator],
        ["translatorUrl", comic?.translatorUrl],
        ["length", comic?.length],
      ]),
    };
  }

  if (selectedNode.type === "lyric") {
    const track = data.lyricTracks.find(
      (item) => item.musicId === selectedNode.id,
    );
    return {
      collection: "lyric_tracks",
      title: track ? `${track.musicId}: lyricTrack` : "Unknown lyricTrack",
      fields: toFields([
        ["musicId", track?.musicId],
        ["sync", track?.sync],
        ["lineCount", track?.lineCount],
      ]),
      jsonText: track ? JSON.stringify(track.lyricJson, null, 2) : undefined,
    };
  }

  const book = data.books.find((item) => item.id === selectedNode.id);
  return {
    collection: "books",
    title: book ? `${book.id}: ${book.name}` : "Unknown book",
    fields: toFields([
      ["id", book?.id],
      ["name", book?.name],
      [
        "novels",
        book?.novels.map(({ novel }) => `${novel.id}: ${novel.title}`) ?? [],
      ],
      ["purchaseLinks", getPurchaseLabels(book?.purchaseLinks ?? null)],
    ]),
  };
};

const getPurchaseLabels = (
  purchaseLinks: AdminDashboardData["books"][number]["purchaseLinks"],
) => {
  if (!purchaseLinks) return [];

  return [
    purchaseLinks.kyoboUrl && "교보",
    purchaseLinks.yes24Url && "yes24",
    purchaseLinks.aladinUrl && "알라딘",
    purchaseLinks.ridiUrl && "리디",
    purchaseLinks.naverUrl && "네이버",
  ].filter((label): label is string => Boolean(label));
};

const emptyDocument = (
  collection: string,
  title: string,
): SelectedDocument => ({
  collection,
  title,
  fields: [],
});

const toFields = (fields: [string, unknown][]) => fields.map(toField);

const toField = ([key, value]: [string, unknown]): DocumentField => ({
  key,
  value:
    value === null || value === undefined
      ? "null"
      : Array.isArray(value)
        ? value.join(", ")
        : String(value),
});
