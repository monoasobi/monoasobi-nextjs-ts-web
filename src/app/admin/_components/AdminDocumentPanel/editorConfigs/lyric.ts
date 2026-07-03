import type { AdminDashboardData, SelectedNode } from "../../AdminDashboard";
import type { EditorConfig } from "../types";
import { formText } from "../utils";
import { numberField, readonlyField, textareaField } from "./fieldFactory";

export const getLyricEditorConfig = (
  data: AdminDashboardData,
  selectedNode: Extract<SelectedNode, { type: "lyric" | "newLyric" }>,
): EditorConfig => {
  const track =
    selectedNode.type === "lyric"
      ? data.lyricTracks.find((item) => item.musicId === selectedNode.id)
      : null;
  const musicId =
    selectedNode.type === "newLyric" ? selectedNode.musicId : track?.musicId;
  const music = data.musics.find((music) => music.id === musicId);

  return {
    title: track ? "Edit lyricTrack" : "Create lyricTrack",
    submitLabel: track ? "저장" : "생성",
    endpoint: track
      ? `/api/admin/lyric-tracks/${track.musicId}`
      : "/api/admin/lyric-tracks",
    deleteEndpoint: track
      ? `/api/admin/lyric-tracks/${track.musicId}`
      : undefined,
    deleteDescription: "lyricTrack 문서만 삭제됩니다.",
    method: track ? "PUT" : "POST",
    fields: [
      readonlyField(
        "musicId",
        "musicId",
        String(musicId ?? ""),
        music ? `${music.id}: ${music.title}` : String(musicId ?? ""),
        true,
      ),
      numberField("sync", "sync", track?.sync ?? 0, true),
      textareaField(
        "lyricJson",
        "lyricJson",
        track ? JSON.stringify(track.lyricJson, null, 2) : "[]",
        true,
      ),
    ],
    toPayload: (formData) => ({
      musicId: formText(formData, "musicId"),
      sync: formText(formData, "sync"),
      lyricJson: JSON.parse(formText(formData, "lyricJson") || "null"),
    }),
  };
};
