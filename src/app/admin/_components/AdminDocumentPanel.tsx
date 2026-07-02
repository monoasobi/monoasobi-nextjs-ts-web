"use client";

import {
  CheckIcon,
  ExclamationTriangleIcon,
  MusicalNoteIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  AlertDialog,
  Badge,
  Button,
  Callout,
  Checkbox,
  Flex,
  Heading,
  IconButton,
  ScrollArea,
  Select,
  Separator,
  Text,
  TextArea,
  TextField,
  Tooltip,
} from "@radix-ui/themes";
import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import type { AdminDashboardData, SelectedNode } from "./AdminDashboard";
import styles from "./AdminPage.module.css";

interface AdminDocumentPanelProps {
  data: AdminDashboardData;
  selectedNode: SelectedNode;
  onSaved: () => void;
}

type AdminMessage = {
  tone: "success" | "error";
  text: string;
};

const EMPTY_SELECT_VALUE = "__empty__";

export const AdminDocumentPanel = ({
  data,
  selectedNode,
  onSaved,
}: AdminDocumentPanelProps) => {
  const selectedDocument = getSelectedDocument(data, selectedNode);
  const config = getEditorConfig(data, selectedNode);
  const isNewDocument = config?.method === "POST";
  const [isEditing, setIsEditing] = useState(Boolean(isNewDocument));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<AdminMessage | null>(null);
  const [visibilityFlags, setVisibilityFlags] = useState<
    Record<string, boolean>
  >(() => getInitialVisibilityFlags(config));
  const formId = `admin-form-${getSelectedNodeKey(selectedNode).replace(
    /[^a-zA-Z0-9]/g,
    "-",
  )}`;

  const handleCancel = () => {
    setMessage(null);
    setIsEditing(false);
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
    config: EditorConfig,
  ) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    let payload: Record<string, unknown>;

    try {
      payload = config.toPayload(formData);
    } catch {
      setIsSaving(false);
      setMessage({
        tone: "error",
        text: "입력값을 확인해주세요. lyricJson은 유효한 JSON이어야 합니다.",
      });
      return;
    }

    const response = await fetch(config.endpoint, {
      method: config.method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    setIsSaving(false);

    if (!response.ok) {
      setMessage({
        tone: "error",
        text: await getErrorMessage(response, "저장에 실패했습니다."),
      });
      return;
    }

    setMessage({
      tone: "success",
      text: config.method === "POST" ? "생성했습니다." : "저장했습니다.",
    });
    setIsEditing(false);
    onSaved();
  };

  const handleDelete = async (config: EditorConfig) => {
    if (!config.deleteEndpoint) return;

    setIsSaving(true);
    setMessage(null);

    const response = await fetch(config.deleteEndpoint, { method: "DELETE" });
    setIsSaving(false);

    if (!response.ok) {
      setMessage({
        tone: "error",
        text: await getErrorMessage(response, "삭제에 실패했습니다."),
      });
      return;
    }

    setMessage({ tone: "success", text: "삭제했습니다." });
    onSaved();
  };

  const visibleFields =
    config?.fields.filter(
      (field) => !field.showWhen || field.showWhen(visibilityFlags),
    ) ?? [];

  return (
    <>
      <Flex className={styles.consolePanelHeader} justify="between" gap="3">
        <Flex direction="column" flexGrow="1" gap="1">
          <Text size="1" color="gray" weight="bold">
            Document
          </Text>
          <div className={styles.documentTitleRow}>
            <Heading size="4">{selectedDocument.title}</Heading>
            {config && isEditing && config.deleteEndpoint && (
              <DeleteDialog
                disabled={isSaving}
                title={selectedDocument.title}
                description={config.deleteDescription}
                onDelete={() => handleDelete(config)}
              />
            )}
          </div>
        </Flex>
        <Flex align="center" gap="2" className={styles.documentActions}>
          <Badge variant="outline">{selectedDocument.collection}</Badge>
          {selectedNode.type === "lyric" && (
            <Tooltip content="Timeline 편집">
              <Button asChild size="1" variant="soft">
                <Link href={`/admin/lyrics/${selectedNode.id}/timeline`}>
                  <MusicalNoteIcon width="14" height="14" />
                  Timeline
                </Link>
              </Button>
            </Tooltip>
          )}
          {config && isEditing ? (
            <>
              <Separator orientation="vertical" decorative />
              <div className={styles.actionGroup}>
                <Tooltip content={config.submitLabel}>
                  <IconButton
                    type="submit"
                    form={formId}
                    size="1"
                    disabled={isSaving}
                    aria-label={config.submitLabel}
                  >
                    <CheckIcon width="16" height="16" />
                  </IconButton>
                </Tooltip>
                <Tooltip content="취소">
                  <IconButton
                    type="button"
                    size="1"
                    variant="soft"
                    color="gray"
                    disabled={isSaving}
                    aria-label="취소"
                    onClick={handleCancel}
                  >
                    <XMarkIcon width="16" height="16" />
                  </IconButton>
                </Tooltip>
              </div>
            </>
          ) : (
            config && (
              <Tooltip content={isNewDocument ? "작성" : "수정"}>
                <IconButton
                  type="button"
                  size="1"
                  variant="soft"
                  aria-label={isNewDocument ? "작성" : "수정"}
                  onClick={() => setIsEditing(true)}
                >
                  <PencilSquareIcon width="16" height="16" />
                </IconButton>
              </Tooltip>
            )
          )}
        </Flex>
      </Flex>

      <ScrollArea
        className={styles.documentScroll}
        type="auto"
        scrollbars="vertical"
      >
        {config && isEditing ? (
          <form
            id={formId}
            className={styles.documentBody}
            onSubmit={(event) => handleSubmit(event, config)}
          >
            {visibleFields.map((field) => (
              <div className={styles.fieldRow} key={field.name}>
                <Text className={styles.fieldKey} size="2">
                  {field.label}
                  {"required" in field && field.required && (
                    <span className={styles.requiredMark} aria-label="필수값">
                      *
                    </span>
                  )}
                </Text>
                <div className={styles.fieldValue}>
                  <EditorField
                    field={field}
                    visibilityFlags={visibilityFlags}
                    onVisibilityChange={(key, value) =>
                      setVisibilityFlags((prev) => ({
                        ...prev,
                        [key]: value,
                      }))
                    }
                  />
                </div>
              </div>
            ))}
            {message && <EditorMessage message={message} />}
          </form>
        ) : (
          <div className={styles.documentBody}>
            {selectedDocument.fields.map((field) => (
              <div className={styles.fieldRow} key={field.key}>
                <Text className={styles.fieldKey} size="2">
                  {field.key}
                </Text>
                <Text className={styles.fieldValue} size="2">
                  {field.value}
                </Text>
              </div>
            ))}
            {selectedDocument.jsonText && (
              <section className={styles.jsonSection}>
                <Text size="2" weight="bold">
                  lyricJson
                </Text>
                <pre className={styles.jsonBox}>
                  {selectedDocument.jsonText}
                </pre>
              </section>
            )}
            {message && <EditorMessage message={message} />}
          </div>
        )}
      </ScrollArea>
    </>
  );
};

const EditorMessage = ({ message }: { message: AdminMessage }) => (
  <Callout.Root
    className={styles.editorMessage}
    size="2"
    color={message.tone === "error" ? "red" : "green"}
    variant="soft"
  >
    <Callout.Icon>
      {message.tone === "error" ? (
        <ExclamationTriangleIcon width="16" height="16" />
      ) : (
        <CheckIcon width="16" height="16" />
      )}
    </Callout.Icon>
    <Callout.Text>{message.text}</Callout.Text>
  </Callout.Root>
);

const DeleteDialog = ({
  disabled,
  title,
  description,
  onDelete,
}: {
  disabled: boolean;
  title: string;
  description: string;
  onDelete: () => void;
}) => (
  <AlertDialog.Root>
    <Tooltip content="삭제">
      <AlertDialog.Trigger>
        <IconButton
          type="button"
          size="1"
          color="red"
          variant="ghost"
          disabled={disabled}
          aria-label="삭제"
        >
          <TrashIcon width="16" height="16" />
        </IconButton>
      </AlertDialog.Trigger>
    </Tooltip>
    <AlertDialog.Content maxWidth="420px">
      <AlertDialog.Title>문서를 삭제할까요?</AlertDialog.Title>
      <AlertDialog.Description size="2">
        {title} 문서를 삭제합니다. {description}
      </AlertDialog.Description>
      <Flex gap="3" justify="end">
        <AlertDialog.Cancel>
          <Button type="button" variant="soft" color="gray">
            취소
          </Button>
        </AlertDialog.Cancel>
        <AlertDialog.Action>
          <Button type="button" color="red" onClick={onDelete}>
            삭제
          </Button>
        </AlertDialog.Action>
      </Flex>
    </AlertDialog.Content>
  </AlertDialog.Root>
);

type EditorFieldConfigBase = {
  name: string;
  label: string;
  showWhen?: (flags: Record<string, boolean>) => boolean;
};

type EditorFieldConfig =
  | (EditorFieldConfigBase & {
      type: "text" | "url" | "number";
      defaultValue?: string | number | null;
      required?: boolean;
    })
  | (EditorFieldConfigBase & {
      type: "readonly";
      defaultValue: string;
      displayValue?: string;
      required?: boolean;
    })
  | (EditorFieldConfigBase & {
      type: "textarea";
      defaultValue?: string | null;
      required?: boolean;
    })
  | (EditorFieldConfigBase & {
      type: "checkbox";
      defaultChecked?: boolean;
    })
  | (EditorFieldConfigBase & {
      type: "select";
      defaultValue?: string;
      options: { value: string; label: string }[];
    });

interface EditorConfig {
  title: string;
  submitLabel: string;
  endpoint: string;
  deleteEndpoint?: string;
  deleteDescription: string;
  method: "POST" | "PUT";
  fields: EditorFieldConfig[];
  toPayload: (formData: FormData) => Record<string, unknown>;
}

const EditorField = ({
  field,
  visibilityFlags,
  onVisibilityChange,
}: {
  field: EditorFieldConfig;
  visibilityFlags: Record<string, boolean>;
  onVisibilityChange: (key: string, value: boolean) => void;
}) => {
  if (field.type === "textarea") {
    return (
      <TextArea
        className={`${styles.editorInput} ${styles.editorTextarea}`}
        name={field.name}
        defaultValue={field.defaultValue ?? ""}
        required={field.required}
      />
    );
  }

  if (field.type === "readonly") {
    return (
      <>
        <input type="hidden" name={field.name} value={field.defaultValue} />
        <Text className={styles.readonlyValue} size="2">
          {field.displayValue ?? field.defaultValue}
        </Text>
      </>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className={styles.editorCheckboxLabel}>
        <Checkbox
          name={field.name}
          checked={visibilityFlags[field.name] ?? field.defaultChecked ?? false}
          onCheckedChange={(checked) =>
            onVisibilityChange(field.name, checked === true)
          }
        />
        <Text size="2">{field.label}</Text>
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <Select.Root
        name={field.name}
        defaultValue={field.defaultValue ?? ""}
        size="2"
      >
        <Select.Trigger className={styles.editorInput} />
        <Select.Content>
          {field.options.map((option) => (
            <Select.Item key={option.value} value={option.value}>
              {option.label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    );
  }

  return (
    <TextField.Root
      className={styles.editorInput}
      name={field.name}
      type={field.type}
      defaultValue={field.defaultValue ?? ""}
      required={field.required}
      step={field.type === "number" ? "any" : undefined}
    />
  );
};

const getEditorConfig = (
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
  }

  if (selectedNode.type === "novel" || selectedNode.type === "newNovel") {
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
        checkboxField(
          "isPublished",
          "isPublished",
          novel?.isPublished ?? false,
        ),
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
  }

  if (selectedNode.type === "comic" || selectedNode.type === "newComic") {
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
  }

  if (selectedNode.type === "lyric" || selectedNode.type === "newLyric") {
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
  }

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

const field = (
  name: string,
  label: string,
  defaultValue?: string | null,
  required = false,
  options: Pick<EditorFieldConfigBase, "showWhen"> = {},
): EditorFieldConfig => ({
  type: "text",
  name,
  label,
  defaultValue,
  required,
  ...options,
});

const urlField = (
  name: string,
  label: string,
  defaultValue?: string | null,
  required = false,
  options: Pick<EditorFieldConfigBase, "showWhen"> = {},
): EditorFieldConfig => ({
  type: "url",
  name,
  label,
  defaultValue,
  required,
  ...options,
});

const readonlyField = (
  name: string,
  label: string,
  defaultValue: string,
  displayValue?: string,
  required = false,
): EditorFieldConfig => ({
  type: "readonly",
  name,
  label,
  defaultValue,
  displayValue,
  required,
});

const numberField = (
  name: string,
  label: string,
  defaultValue?: number,
  required = false,
): EditorFieldConfig => ({
  type: "number",
  name,
  label,
  defaultValue,
  required,
});

const textareaField = (
  name: string,
  label: string,
  defaultValue?: string,
  required = false,
): EditorFieldConfig => ({
  type: "textarea",
  name,
  label,
  defaultValue,
  required,
});

const checkboxField = (
  name: string,
  label: string,
  defaultChecked: boolean,
): EditorFieldConfig => ({
  type: "checkbox",
  name,
  label,
  defaultChecked,
});

const selectField = (
  name: string,
  label: string,
  defaultValue: string,
  options: { value: string; label: string }[],
  fieldOptions: Pick<EditorFieldConfigBase, "showWhen"> = {},
): EditorFieldConfig => ({
  type: "select",
  name,
  label,
  defaultValue,
  options,
  ...fieldOptions,
});

const getInitialVisibilityFlags = (config: EditorConfig | null) => {
  if (!config) return {};

  return config.fields.reduce<Record<string, boolean>>((flags, field) => {
    if (field.type === "checkbox") {
      flags[field.name] = field.defaultChecked ?? false;
    }

    return flags;
  }, {});
};

const getErrorMessage = async (response: Response, fallback: string) => {
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

const formText = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "");

const normalizeSelectValue = (value: string) =>
  value === EMPTY_SELECT_VALUE ? "" : value;

const getSelectedNodeKey = (selectedNode: SelectedNode) =>
  "id" in selectedNode
    ? `${selectedNode.type}:${selectedNode.id}`
    : "musicId" in selectedNode
      ? `${selectedNode.type}:${selectedNode.musicId}`
      : selectedNode.type;

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

const getSelectedDocument = (
  data: AdminDashboardData,
  selectedNode: SelectedNode,
) => {
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

const emptyDocument = (collection: string, title: string) => ({
  collection,
  title,
  fields: [],
});

const toFields = (fields: [string, unknown][]) => fields.map(toField);

const toField = ([key, value]: [string, unknown]) => ({
  key,
  value:
    value === null || value === undefined
      ? "null"
      : Array.isArray(value)
        ? value.join(", ")
        : String(value),
});
