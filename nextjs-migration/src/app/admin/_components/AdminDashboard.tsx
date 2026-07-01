"use client";

import {
  AlertDialog,
  Badge,
  Button,
  Card,
  Flex,
  Heading,
  ScrollArea,
  Text,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { FormEvent, useMemo, useState } from "react";
import styles from "./AdminPage.module.css";

type AdminDashboardData = Awaited<
  ReturnType<typeof import("@/server/queries/admin").getAdminDashboard>
>;

type SelectedNode =
  | { type: "music"; id: number }
  | { type: "novel"; id: number }
  | { type: "comic"; id: number }
  | { type: "lyric"; id: number }
  | { type: "book"; id: number }
  | { type: "newMusic" }
  | { type: "newNovel"; musicId: number }
  | { type: "newComic"; musicId: number }
  | { type: "newLyric"; musicId: number }
  | { type: "newBook" };

interface AdminDashboardProps {
  data: AdminDashboardData;
}

export const AdminDashboard = ({ data }: AdminDashboardProps) => {
  const router = useRouter();
  const [selectedNode, setSelectedNode] = useState<SelectedNode>({
    type: "music",
    id: data.musics[0]?.id ?? 0,
  });
  const [expandedMusicIds, setExpandedMusicIds] = useState<Set<number>>(
    () => new Set(data.musics[0] ? [data.musics[0].id] : []),
  );

  const tree = useMemo(() => {
    const novelsByMusicId = new Map<number, typeof data.novels>();
    const comicsByMusicId = new Map<number, typeof data.comics>();
    const lyricByMusicId = new Map(
      data.lyricTracks.map((track) => [track.musicId, track]),
    );

    for (const novel of data.novels) {
      const novels = novelsByMusicId.get(novel.musicId) ?? [];
      novels.push(novel);
      novelsByMusicId.set(novel.musicId, novels);
    }

    for (const comic of data.comics) {
      const comics = comicsByMusicId.get(comic.musicId) ?? [];
      comics.push(comic);
      comicsByMusicId.set(comic.musicId, comics);
    }

    return { novelsByMusicId, comicsByMusicId, lyricByMusicId };
  }, [data]);

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.refresh();
  };

  const toggleMusic = (musicId: number) => {
    setExpandedMusicIds((prev) => {
      const next = new Set(prev);
      if (next.has(musicId)) {
        next.delete(musicId);
      } else {
        next.add(musicId);
      }
      return next;
    });
  };

  return (
    <div className={styles.container}>
      <Flex className={styles.header} justify="between" align="center" gap="3">
        <Flex direction="column" gap="1">
          <Heading size="5">Admin</Heading>
        </Flex>
        <Button
          type="button"
          variant="soft"
          color="gray"
          onClick={handleLogout}
        >
          로그아웃
        </Button>
      </Flex>

      <section className={styles.console}>
        <Card className={styles.consoleSidebar}>
          <ScrollArea
            className={styles.treeScroll}
            type="auto"
            scrollbars="vertical"
          >
            <div className={styles.tree}>
              <TreeSection
                label="Music"
                count={data.musics.length}
                action={
                  <Button
                    type="button"
                    size="1"
                    variant="soft"
                    onClick={() => setSelectedNode({ type: "newMusic" })}
                  >
                    + Music
                  </Button>
                }
              >
                {data.musics.map((music) => {
                  const novels = tree.novelsByMusicId.get(music.id) ?? [];
                  const comics = tree.comicsByMusicId.get(music.id) ?? [];
                  const lyricTrack = tree.lyricByMusicId.get(music.id);
                  const isExpanded = expandedMusicIds.has(music.id);

                  return (
                    <div className={styles.treeDocument} key={music.id}>
                      <MusicTreeButton
                        musicId={music.id}
                        label={music.title}
                        meta={`${music.korTitle} / ${music.enTitle}`}
                        isExpanded={isExpanded}
                        isActive={
                          selectedNode.type === "music" &&
                          selectedNode.id === music.id
                        }
                        onToggle={() => toggleMusic(music.id)}
                        onSelect={() =>
                          setSelectedNode({ type: "music", id: music.id })
                        }
                      />
                      {isExpanded && (
                        <div className={styles.treeChildren}>
                          <div className={styles.treeActions}>
                            {novels.length === 0 && (
                              <Button
                                type="button"
                                size="1"
                                variant="soft"
                                onClick={() =>
                                  setSelectedNode({
                                    type: "newNovel",
                                    musicId: music.id,
                                  })
                                }
                              >
                                + Novel
                              </Button>
                            )}
                            {comics.length === 0 && (
                              <Button
                                type="button"
                                size="1"
                                variant="soft"
                                onClick={() =>
                                  setSelectedNode({
                                    type: "newComic",
                                    musicId: music.id,
                                  })
                                }
                              >
                                + Comic
                              </Button>
                            )}
                            {!lyricTrack && (
                              <Button
                                type="button"
                                size="1"
                                variant="soft"
                                onClick={() =>
                                  setSelectedNode({
                                    type: "newLyric",
                                    musicId: music.id,
                                  })
                                }
                              >
                                + Lyric
                              </Button>
                            )}
                          </div>
                          {novels.map((novel) => (
                            <TreeButton
                              key={novel.id}
                              depth={2}
                              badge={`NOVEL #${novel.id}`}
                              kind="child"
                              label={novel.title}
                              meta={novel.writer}
                              isActive={
                                selectedNode.type === "novel" &&
                                selectedNode.id === novel.id
                              }
                              onClick={() =>
                                setSelectedNode({
                                  type: "novel",
                                  id: novel.id,
                                })
                              }
                            />
                          ))}
                          {comics.map((comic) => (
                            <TreeButton
                              key={comic.id}
                              depth={2}
                              badge={`COMIC #${comic.id}`}
                              kind="child"
                              label={comic.title}
                              meta={`${comic.writer} / ${comic.length}p`}
                              isActive={
                                selectedNode.type === "comic" &&
                                selectedNode.id === comic.id
                              }
                              onClick={() =>
                                setSelectedNode({
                                  type: "comic",
                                  id: comic.id,
                                })
                              }
                            />
                          ))}
                          {lyricTrack && (
                            <TreeButton
                              depth={2}
                              badge="LYRIC"
                              kind="child"
                              label={music.title}
                              meta={`${lyricTrack.lineCount} lines`}
                              isActive={
                                selectedNode.type === "lyric" &&
                                selectedNode.id === music.id
                              }
                              onClick={() =>
                                setSelectedNode({
                                  type: "lyric",
                                  id: music.id,
                                })
                              }
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </TreeSection>

              <TreeSection
                label="Books"
                count={data.books.length}
                action={
                  <Button
                    type="button"
                    size="1"
                    variant="soft"
                    onClick={() => setSelectedNode({ type: "newBook" })}
                  >
                    + Book
                  </Button>
                }
              >
                {data.books.map((book) => (
                  <TreeButton
                    key={book.id}
                    depth={1}
                    badge={`BOOK #${book.id}`}
                    kind="book"
                    label={book.name}
                    meta={`${book.novels.length} novels`}
                    isActive={
                      selectedNode.type === "book" &&
                      selectedNode.id === book.id
                    }
                    onClick={() =>
                      setSelectedNode({ type: "book", id: book.id })
                    }
                  />
                ))}
              </TreeSection>
            </div>
          </ScrollArea>
        </Card>

        <Card className={styles.documentPanel}>
          <AdminDocumentPanel
            key={getSelectedNodeKey(selectedNode)}
            data={data}
            selectedNode={selectedNode}
            onSaved={() => router.refresh()}
          />
        </Card>
      </section>
    </div>
  );
};

const TreeSection = ({
  label,
  count,
  action,
  children,
}: {
  label: string;
  count: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className={styles.treeSection}>
    <div className={styles.collectionLabel}>
      <Text size="1" weight="bold">
        {label}
      </Text>
      <Flex align="center" gap="2">
        <Badge variant="outline">{count}</Badge>
        {action}
      </Flex>
    </div>
    {children}
  </div>
);

const MusicTreeButton = ({
  musicId,
  label,
  meta,
  isExpanded,
  isActive,
  onToggle,
  onSelect,
}: {
  musicId: number;
  label: string;
  meta: string;
  isExpanded: boolean;
  isActive: boolean;
  onToggle: () => void;
  onSelect: () => void;
}) => (
  <div className={styles.musicTreeRow} data-active={isActive}>
    <button
      type="button"
      className={styles.expandButton}
      aria-label={isExpanded ? "곡 접기" : "곡 펼치기"}
      aria-expanded={isExpanded}
      onClick={onToggle}
    >
      <span className={styles.chevron} data-expanded={isExpanded}>
        ▸
      </span>
    </button>
    <button
      type="button"
      className={styles.musicSelectButton}
      onClick={onSelect}
    >
      <span className={styles.treeButtonContent}>
        <Badge className={styles.treeButtonBadge} variant="outline">
          MUSIC #{musicId}
        </Badge>
        <span className={styles.treeButtonLabel}>{label}</span>
      </span>
      <span className={styles.treeButtonMeta}>{meta}</span>
    </button>
  </div>
);

const TreeButton = ({
  depth,
  badge,
  kind,
  label,
  meta,
  isActive,
  onClick,
}: {
  depth: number;
  badge: string;
  kind: "music" | "child" | "book";
  label: string;
  meta: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    className={styles.treeButton}
    data-active={isActive}
    data-kind={kind}
    style={getDepthStyle(depth)}
    onClick={onClick}
  >
    <span className={styles.treeButtonContent}>
      <Badge className={styles.treeButtonBadge} variant="outline">
        {badge}
      </Badge>
      <span className={styles.treeButtonLabel}>{label}</span>
    </span>
    <span className={styles.treeButtonMeta}>{meta}</span>
  </button>
);

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

const AdminDocumentPanel = ({
  data,
  selectedNode,
  onSaved,
}: {
  data: AdminDashboardData;
  selectedNode: SelectedNode;
  onSaved: () => void;
}) => {
  const selectedDocument = getSelectedDocument(data, selectedNode);
  const config = getEditorConfig(data, selectedNode);
  const isNewDocument = config?.method === "POST";
  const [isEditing, setIsEditing] = useState(Boolean(isNewDocument));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [visibilityFlags, setVisibilityFlags] = useState<
    Record<string, boolean>
  >(() => getInitialVisibilityFlags(config));
  const formId = `admin-form-${getSelectedNodeKey(selectedNode).replace(
    /[^a-zA-Z0-9]/g,
    "-",
  )}`;

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
    config: EditorConfig,
  ) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    let payload: Record<string, unknown>;

    try {
      payload = config.toPayload(formData);
    } catch {
      setIsSaving(false);
      setMessage("입력값을 확인해주세요.");
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
      setMessage("저장에 실패했습니다.");
      return;
    }

    setMessage("저장했습니다.");
    setIsEditing(false);
    onSaved();
  };

  const handleDelete = async (config: EditorConfig) => {
    if (!config.deleteEndpoint) return;

    setIsSaving(true);
    setMessage("");

    const response = await fetch(config.deleteEndpoint, { method: "DELETE" });
    setIsSaving(false);

    if (!response.ok) {
      setMessage("삭제에 실패했습니다.");
      return;
    }

    setMessage("삭제했습니다.");
    onSaved();
  };

  const visibleFields =
    config?.fields.filter(
      (field) => !field.showWhen || field.showWhen(visibilityFlags),
    ) ?? [];

  return (
    <>
      <Flex className={styles.consolePanelHeader} justify="between" gap="3">
        <Flex direction="column" gap="1">
          <Text size="1" color="gray" weight="bold">
            Document
          </Text>
          <Heading size="4">{selectedDocument.title}</Heading>
        </Flex>
        <Flex align="center" gap="2">
          <Badge variant="outline">{selectedDocument.collection}</Badge>
          {config && isEditing ? (
            <>
              {config.deleteEndpoint && (
                <DeleteDialog
                  disabled={isSaving}
                  title={selectedDocument.title}
                  onDelete={() => handleDelete(config)}
                />
              )}
              <Button
                type="submit"
                form={formId}
                size="1"
                disabled={isSaving}
                aria-label={config.submitLabel}
              >
                {isSaving ? "..." : "✓"}
              </Button>
              <Button
                type="button"
                size="1"
                variant="soft"
                color="gray"
                disabled={isSaving}
                aria-label="취소"
                onClick={() => setIsEditing(false)}
              >
                ×
              </Button>
            </>
          ) : (
            config && (
              <Button
                type="button"
                size="1"
                variant="soft"
                onClick={() => setIsEditing(true)}
              >
                {isNewDocument ? "작성" : "수정"}
              </Button>
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
            {message && (
              <Text
                className={styles.editorMessage}
                size="2"
                color={message.includes("실패") ? "red" : "green"}
              >
                {message}
              </Text>
            )}
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
            {message && (
              <Text
                className={styles.editorMessage}
                size="2"
                color={message.includes("실패") ? "red" : "green"}
              >
                {message}
              </Text>
            )}
          </div>
        )}
      </ScrollArea>
    </>
  );
};

const DeleteDialog = ({
  disabled,
  title,
  onDelete,
}: {
  disabled: boolean;
  title: string;
  onDelete: () => void;
}) => (
  <AlertDialog.Root>
    <AlertDialog.Trigger>
      <Button
        type="button"
        size="1"
        color="red"
        variant="soft"
        disabled={disabled}
      >
        삭제
      </Button>
    </AlertDialog.Trigger>
    <AlertDialog.Content maxWidth="420px">
      <AlertDialog.Title>문서를 삭제할까요?</AlertDialog.Title>
      <AlertDialog.Description size="2">
        {title} 문서를 삭제합니다. 하위 참조가 있는 항목은 관련 데이터도 함께
        정리될 수 있습니다.
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
      type: "text" | "number";
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
        <input
          className={styles.editorCheckbox}
          type="checkbox"
          name={field.name}
          checked={visibilityFlags[field.name] ?? field.defaultChecked ?? false}
          onChange={(event) =>
            onVisibilityChange(field.name, event.target.checked)
          }
        />
        <span>{field.label}</span>
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <select
        className={styles.editorSelect}
        name={field.name}
        defaultValue={field.defaultValue ?? ""}
      >
        {field.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <TextField.Root
      className={styles.editorInput}
      name={field.name}
      type={field.type}
      defaultValue={field.defaultValue ?? ""}
      required={field.required}
    />
  );
};

const getEditorConfig = (
  data: AdminDashboardData,
  selectedNode: SelectedNode,
): EditorConfig | null => {
  const bookOptions = [
    { value: "", label: "없음" },
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
        field("originUrl", "originUrl", novel?.originUrl, true),
        checkboxField("translated", "translated", novel?.translated ?? false),
        field("translator", "translator", novel?.translator ?? "", false, {
          showWhen: (flags) => flags.translated,
        }),
        field(
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
          String(novel?.bookId ?? ""),
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
          bookId: isPublished ? formText(formData, "bookId") : "",
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
        field("originUrl", "originUrl", comic?.originUrl, true),
        field("translator", "translator", comic?.translator, true),
        field("translatorUrl", "translatorUrl", comic?.translatorUrl, true),
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
        lyricJson: JSON.parse(formText(formData, "lyricJson") || "[]"),
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
    method: book ? "PUT" : "POST",
    fields: [
      field("name", "name", book?.name, true),
      field(
        "novelIds",
        "novelIds",
        book?.novels.map(({ novel }) => novel.id).join(", ") ?? "",
      ),
      field("kyoboUrl", "kyoboUrl", book?.purchaseLinks?.kyoboUrl ?? ""),
      field("yes24Url", "yes24Url", book?.purchaseLinks?.yes24Url ?? ""),
      field("aladinUrl", "aladinUrl", book?.purchaseLinks?.aladinUrl ?? ""),
      field("ridiUrl", "ridiUrl", book?.purchaseLinks?.ridiUrl ?? ""),
      field("naverUrl", "naverUrl", book?.purchaseLinks?.naverUrl ?? ""),
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

const formText = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "");

const getSelectedNodeKey = (selectedNode: SelectedNode) =>
  "id" in selectedNode
    ? `${selectedNode.type}:${selectedNode.id}`
    : "musicId" in selectedNode
      ? `${selectedNode.type}:${selectedNode.musicId}`
      : selectedNode.type;

const getDepthStyle = (depth: number) =>
  ({ "--depth": depth }) as CSSProperties;

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
