"use client";

import {
  Badge,
  Button,
  Card,
  Flex,
  Heading,
  ScrollArea,
  Text,
} from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import styles from "./AdminPage.module.css";

type AdminDashboardData = Awaited<
  ReturnType<typeof import("@/server/queries/admin").getAdminDashboard>
>;

type SelectedNode =
  | { type: "music"; id: number }
  | { type: "novel"; id: number }
  | { type: "comic"; id: number }
  | { type: "lyric"; id: number }
  | { type: "book"; id: number };

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

  const selectedDocument = getSelectedDocument(data, selectedNode);

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
              <TreeSection label="Music" count={data.musics.length}>
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
                              label="lyricTrack"
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

              <TreeSection label="Books" count={data.books.length}>
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
          <Flex className={styles.consolePanelHeader} justify="between" gap="3">
            <Flex direction="column" gap="1">
              <Text size="1" color="gray" weight="bold">
                Document
              </Text>
              <Heading size="4">{selectedDocument.title}</Heading>
            </Flex>
            <Badge variant="outline">{selectedDocument.collection}</Badge>
          </Flex>

          <ScrollArea
            className={styles.documentScroll}
            type="auto"
            scrollbars="vertical"
          >
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
            </div>
          </ScrollArea>
        </Card>
      </section>
    </div>
  );
};

const TreeSection = ({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) => (
  <div className={styles.treeSection}>
    <div className={styles.collectionLabel}>
      <Text size="1" weight="bold">
        {label}
      </Text>
      <Badge variant="outline">{count}</Badge>
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

const getDepthStyle = (depth: number) =>
  ({ "--depth": depth }) as CSSProperties;

const getSelectedDocument = (
  data: AdminDashboardData,
  selectedNode: SelectedNode,
) => {
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
        ["r2Key", novel ? `novel/${novel.id}.md` : null],
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
        ["r2Prefix", comic ? `comics/${comic.id}/` : null],
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
