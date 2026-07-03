import type { AdminDashboardData, SelectedNode } from "../../AdminDashboard";
import type { EditorConfig } from "../types";
import { formText } from "../utils";
import { field, urlField } from "./fieldFactory";

export const getBookEditorConfig = (
  data: AdminDashboardData,
  selectedNode: Extract<SelectedNode, { type: "book" | "newBook" }>,
): EditorConfig => {
  const book =
    selectedNode.type === "book"
      ? data.books.find((item) => item.id === selectedNode.id)
      : null;

  return {
    title: book ? "Edit book" : "Create book",
    submitLabel: book ? "저장" : "생성",
    endpoint: book ? `/api/admin/books/${book.id}` : "/api/admin/books",
    deleteEndpoint: book ? `/api/admin/books/${book.id}` : undefined,
    deleteDescription: "novel 연결 정보와 구매 링크가 함께 삭제됩니다.",
    method: book ? "PUT" : "POST",
    fields: [
      field("name", "name", book?.name, true),
      field(
        "novelIds",
        "novelIds",
        book?.novels.map(({ novel }) => novel.id).join(", ") ?? "",
      ),
      urlField("kyoboUrl", "kyoboUrl", book?.purchaseLinks?.kyoboUrl ?? ""),
      urlField("yes24Url", "yes24Url", book?.purchaseLinks?.yes24Url ?? ""),
      urlField("aladinUrl", "aladinUrl", book?.purchaseLinks?.aladinUrl ?? ""),
      urlField("ridiUrl", "ridiUrl", book?.purchaseLinks?.ridiUrl ?? ""),
      urlField("naverUrl", "naverUrl", book?.purchaseLinks?.naverUrl ?? ""),
    ],
    toPayload: (formData) => ({
      name: formText(formData, "name"),
      novelIds: formText(formData, "novelIds")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
      purchaseLinks: {
        kyoboUrl: formText(formData, "kyoboUrl"),
        yes24Url: formText(formData, "yes24Url"),
        aladinUrl: formText(formData, "aladinUrl"),
        ridiUrl: formText(formData, "ridiUrl"),
        naverUrl: formText(formData, "naverUrl"),
      },
    }),
  };
};
