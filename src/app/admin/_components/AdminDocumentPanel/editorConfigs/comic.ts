import type { AdminDashboardData, SelectedNode } from "../../AdminDashboard";
import type { EditorConfig } from "../types";
import { formText } from "../utils";
import { field, numberField, readonlyField, urlField } from "./fieldFactory";

export const getComicEditorConfig = (
  data: AdminDashboardData,
  selectedNode: Extract<SelectedNode, { type: "comic" | "newComic" }>,
): EditorConfig => {
  const comic =
    selectedNode.type === "comic"
      ? data.comics.find((item) => item.id === selectedNode.id)
      : null;
  const musicId =
    selectedNode.type === "newComic" ? selectedNode.musicId : comic?.musicId;
  const music = data.musics.find((music) => music.id === musicId);

  return {
    title: comic ? "Edit comic" : "Create comic",
    submitLabel: comic ? "저장" : "생성",
    endpoint: comic ? `/api/admin/comics/${comic.id}` : "/api/admin/comics",
    deleteEndpoint: comic ? `/api/admin/comics/${comic.id}` : undefined,
    deleteDescription: "comic 문서만 삭제됩니다.",
    method: comic ? "PUT" : "POST",
    fields: [
      readonlyField(
        "musicId",
        "musicId",
        String(musicId ?? ""),
        music ? `${music.id}: ${music.title}` : String(musicId ?? ""),
        true,
      ),
      field("title", "title", comic?.title, true),
      field("writer", "writer", comic?.writer, true),
      urlField("originUrl", "originUrl", comic?.originUrl, true),
      field("translator", "translator", comic?.translator, true),
      urlField("translatorUrl", "translatorUrl", comic?.translatorUrl, true),
      numberField("length", "length", comic?.length ?? 1, true),
    ],
    toPayload: (formData) => ({
      musicId: formText(formData, "musicId"),
      title: formText(formData, "title"),
      writer: formText(formData, "writer"),
      originUrl: formText(formData, "originUrl"),
      translator: formText(formData, "translator"),
      translatorUrl: formText(formData, "translatorUrl"),
      length: formText(formData, "length"),
    }),
  };
};
