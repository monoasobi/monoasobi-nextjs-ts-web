import type { AdminDashboardData, SelectedNode } from "../../AdminDashboard";
import type { EditorConfig } from "../types";
import { EMPTY_SELECT_VALUE, formText, normalizeSelectValue } from "../utils";
import {
  checkboxField,
  field,
  readonlyField,
  selectField,
  urlField,
} from "./fieldFactory";

export const getNovelEditorConfig = (
  data: AdminDashboardData,
  selectedNode: Extract<SelectedNode, { type: "novel" | "newNovel" }>,
  bookOptions: { value: string; label: string }[],
): EditorConfig => {
  const novel =
    selectedNode.type === "novel"
      ? data.novels.find((item) => item.id === selectedNode.id)
      : null;
  const musicId =
    selectedNode.type === "newNovel" ? selectedNode.musicId : novel?.musicId;
  const music = data.musics.find((music) => music.id === musicId);

  return {
    title: novel ? "Edit novel" : "Create novel",
    submitLabel: novel ? "저장" : "생성",
    endpoint: novel ? `/api/admin/novels/${novel.id}` : "/api/admin/novels",
    deleteEndpoint: novel ? `/api/admin/novels/${novel.id}` : undefined,
    deleteDescription: "book 연결 정보가 함께 삭제됩니다.",
    method: novel ? "PUT" : "POST",
    fields: [
      readonlyField(
        "musicId",
        "musicId",
        String(musicId ?? ""),
        music ? `${music.id}: ${music.title}` : String(musicId ?? ""),
        true,
      ),
      field("title", "title", novel?.title, true),
      field("writer", "writer", novel?.writer, true),
      urlField("originUrl", "originUrl", novel?.originUrl, true),
      checkboxField("translated", "translated", novel?.translated ?? false),
      field("translator", "translator", novel?.translator ?? "", false, {
        showWhen: (flags) => flags.translated,
      }),
      urlField(
        "translatorUrl",
        "translatorUrl",
        novel?.translatorUrl ?? "",
        false,
        {
          showWhen: (flags) => flags.translated,
        },
      ),
      checkboxField("isPublished", "isPublished", novel?.isPublished ?? false),
      selectField(
        "bookId",
        "bookId",
        novel?.bookId ? String(novel.bookId) : EMPTY_SELECT_VALUE,
        bookOptions,
        {
          showWhen: (flags) => flags.isPublished,
        },
      ),
    ],
    toPayload: (formData) => {
      const translated = formData.has("translated");
      const isPublished = formData.has("isPublished");

      return {
        musicId: formText(formData, "musicId"),
        bookId: isPublished
          ? normalizeSelectValue(formText(formData, "bookId"))
          : "",
        title: formText(formData, "title"),
        writer: formText(formData, "writer"),
        originUrl: formText(formData, "originUrl"),
        translator: translated ? formText(formData, "translator") : "",
        translatorUrl: translated ? formText(formData, "translatorUrl") : "",
        translated,
        isPublished,
      };
    },
  };
};
