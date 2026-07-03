import type { SelectedNode } from "../AdminDashboard";
import type { EditorConfig } from "./types";

export const EMPTY_SELECT_VALUE = "__empty__";

export const getInitialVisibilityFlags = (config: EditorConfig | null) => {
  if (!config) return {};

  return config.fields.reduce<Record<string, boolean>>((flags, field) => {
    if (field.type === "checkbox") {
      flags[field.name] = field.defaultChecked ?? false;
    }

    return flags;
  }, {});
};

export const getErrorMessage = async (
  response: Response,
  fallback: string,
) => {
  const body = await response.json().catch(() => null);
  if (!body || typeof body !== "object") return fallback;

  const issue = Array.isArray(body.issues) ? body.issues[0] : null;
  if (issue && typeof issue.message === "string") {
    const path = Array.isArray(issue.path) ? issue.path.join(".") : "";
    return path ? `${path}: ${issue.message}` : issue.message;
  }

  if ("error" in body && typeof body.error === "string") return body.error;

  return fallback;
};

export const formText = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "");

export const normalizeSelectValue = (value: string) =>
  value === EMPTY_SELECT_VALUE ? "" : value;

export const getSelectedNodeKey = (selectedNode: SelectedNode) =>
  "id" in selectedNode
    ? `${selectedNode.type}:${selectedNode.id}`
    : "musicId" in selectedNode
      ? `${selectedNode.type}:${selectedNode.musicId}`
      : selectedNode.type;
