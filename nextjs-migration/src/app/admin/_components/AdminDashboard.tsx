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
import { AdminDocumentPanel } from "./AdminDocumentPanel";
import styles from "./AdminPage.module.css";

export type AdminDashboardData = Awaited<
  ReturnType<typeof import("@/server/queries/admin").getAdminDashboard>
>;

export type SelectedNode =
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

const getSelectedNodeKey = (selectedNode: SelectedNode) =>
  "id" in selectedNode
    ? `${selectedNode.type}:${selectedNode.id}`
    : "musicId" in selectedNode
      ? `${selectedNode.type}:${selectedNode.musicId}`
      : selectedNode.type;

const getDepthStyle = (depth: number) =>
  ({ "--depth": depth }) as CSSProperties;
