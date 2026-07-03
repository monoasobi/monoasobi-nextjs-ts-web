import type { AdminDashboardData, SelectedNode } from "../../AdminDashboard";
import type { EditorConfig } from "../types";
import { formText } from "../utils";
import { field } from "./fieldFactory";

export const getMusicEditorConfig = (
  data: AdminDashboardData,
  selectedNode: Extract<SelectedNode, { type: "music" | "newMusic" }>,
): EditorConfig => {
  const music =
    selectedNode.type === "music"
      ? data.musics.find((item) => item.id === selectedNode.id)
      : null;

  return {
    title: music ? "Edit music" : "Create music",
    submitLabel: music ? "저장" : "생성",
    endpoint: music ? `/api/admin/musics/${music.id}` : "/api/admin/musics",
    deleteEndpoint: music ? `/api/admin/musics/${music.id}` : undefined,
    deleteDescription:
      "연결된 novel, comic, lyricTrack과 book 연결 정보도 함께 삭제됩니다.",
    method: music ? "PUT" : "POST",
    fields: [
      field("title", "title", music?.title, true),
      field("korTitle", "korTitle", music?.korTitle, true),
      field("enTitle", "enTitle", music?.enTitle, true),
      field("youtubeId", "youtubeId", music?.youtubeId ?? ""),
      field("specialPath", "specialPath", music?.specialPath ?? ""),
    ],
    toPayload: (formData) => ({
      title: formText(formData, "title"),
      korTitle: formText(formData, "korTitle"),
      enTitle: formText(formData, "enTitle"),
      youtubeId: formText(formData, "youtubeId"),
      specialPath: formText(formData, "specialPath"),
    }),
  };
};
