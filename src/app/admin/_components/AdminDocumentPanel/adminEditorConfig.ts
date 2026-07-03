import type { AdminDashboardData, SelectedNode } from "../AdminDashboard";
import type { EditorConfig } from "./types";
import { EMPTY_SELECT_VALUE } from "./utils";
import { getBookEditorConfig } from "./editorConfigs/book";
import { getComicEditorConfig } from "./editorConfigs/comic";
import { getLyricEditorConfig } from "./editorConfigs/lyric";
import { getMusicEditorConfig } from "./editorConfigs/music";
import { getNovelEditorConfig } from "./editorConfigs/novel";

export const getEditorConfig = (
  data: AdminDashboardData,
  selectedNode: SelectedNode,
): EditorConfig | null => {
  const bookOptions = [
    { value: EMPTY_SELECT_VALUE, label: "없음" },
    ...data.books.map((book) => ({
      value: String(book.id),
      label: `${book.id}: ${book.name}`,
    })),
  ];

  if (selectedNode.type === "music" || selectedNode.type === "newMusic") {
    return getMusicEditorConfig(data, selectedNode);
  }

  if (selectedNode.type === "novel" || selectedNode.type === "newNovel") {
    return getNovelEditorConfig(data, selectedNode, bookOptions);
  }

  if (selectedNode.type === "comic" || selectedNode.type === "newComic") {
    return getComicEditorConfig(data, selectedNode);
  }

  if (selectedNode.type === "lyric" || selectedNode.type === "newLyric") {
    return getLyricEditorConfig(data, selectedNode);
  }

  return getBookEditorConfig(data, selectedNode);
};
