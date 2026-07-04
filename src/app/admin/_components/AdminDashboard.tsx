"use client";

import type { AdminRole } from "@appTypes/admin";
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
import type { CSSProperties, UIEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
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

interface StoredAdminDashboardState {
  selectedNode: SelectedNode;
  expandedMusicIds: number[];
  scrollTop: number;
}

interface AdminDashboardProps {
  data: AdminDashboardData;
  role: AdminRole;
}

const ADMIN_DASHBOARD_STATE_KEY = "monoasobi-admin-dashboard-state";

export const AdminDashboard = ({ data, role }: AdminDashboardProps) => {
  const router = useRouter();
  const canManage = role === "admin";
  const treeScrollRef = useRef<HTMLDivElement>(null);
  const [initialState] = useState(() =>
    getInitialAdminDashboardState(data, canManage),
  );
  const [selectedNode, setSelectedNode] = useState<SelectedNode>(
    initialState.selectedNode,
  );
  const [expandedMusicIds, setExpandedMusicIds] = useState<Set<number>>(
    () => new Set(initialState.expandedMusicIds),
  );
  const [treeScrollTop, setTreeScrollTop] = useState(initialState.scrollTop);

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

  const resolvedSelectedNode = useMemo(
    () =>
      isValidSelectedNode(selectedNode, data, canManage)
        ? selectedNode
        : getDefaultSelectedNode(data),
    [canManage, data, selectedNode],
  );
  const persistedExpandedMusicIds = useMemo(() => {
    const musicIds = new Set(data.musics.map((music) => music.id));
    const next = [...expandedMusicIds].filter((musicId) =>
      musicIds.has(musicId),
    );

    return next.length > 0 || !data.musics[0] ? next : [data.musics[0].id];
  }, [data, expandedMusicIds]);

  useEffect(() => {
    saveAdminDashboardState({
      selectedNode: resolvedSelectedNode,
      expandedMusicIds: persistedExpandedMusicIds,
      scrollTop: treeScrollTop,
    });
  }, [persistedExpandedMusicIds, resolvedSelectedNode, treeScrollTop]);

  useEffect(() => {
    if (!initialState.scrollTop) return;
    treeScrollRef.current?.scrollTo({ top: initialState.scrollTop });
  }, [initialState.scrollTop]);

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

  const handleTreeScroll = (event: UIEvent<HTMLDivElement>) => {
    setTreeScrollTop(event.currentTarget.scrollTop);
  };

  return (
    <div className={styles.container}>
      <Flex className={styles.header} justify="between" align="center" gap="3">
        <Flex direction="column" gap="1">
          <Flex align="center" gap="2">
            <Heading size="5">Admin</Heading>
            {role === "viewer" && (
              <Badge color="gray" variant="soft">
                Viewer
              </Badge>
            )}
          </Flex>
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
            ref={treeScrollRef}
            className={styles.treeScroll}
            type="auto"
            scrollbars="vertical"
            onScroll={handleTreeScroll}
          >
            <div className={styles.tree}>
              <TreeSection
                label="Music"
                count={data.musics.length}
                action={
                  canManage ? (
                    <Button
                      type="button"
                      size="1"
                      variant="soft"
                      onClick={() => setSelectedNode({ type: "newMusic" })}
                    >
                      + Music
                    </Button>
                  ) : undefined
                }
              >
                {data.musics.map((music) => {
                  const novels = novelsByMusicId.get(music.id) ?? [];
                  const comics = comicsByMusicId.get(music.id) ?? [];
                  const lyricTrack = lyricByMusicId.get(music.id);
                  const isExpanded = expandedMusicIds.has(music.id);

                  return (
                    <div className={styles.treeDocument} key={music.id}>
                      <MusicTreeButton
                        musicId={music.id}
                        label={music.title}
                        meta={`${music.korTitle} / ${music.enTitle}`}
                        isExpanded={isExpanded}
                        isActive={
                          resolvedSelectedNode.type === "music" &&
                          resolvedSelectedNode.id === music.id
                        }
                        onToggle={() => toggleMusic(music.id)}
                        onSelect={() =>
                          setSelectedNode({ type: "music", id: music.id })
                        }
                      />
                      {isExpanded && (
                        <div className={styles.treeChildren}>
                          <div className={styles.treeActions}>
                            {canManage && novels.length === 0 && (
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
                            {canManage && comics.length === 0 && (
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
                            {canManage && !lyricTrack && (
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
                                resolvedSelectedNode.type === "novel" &&
                                resolvedSelectedNode.id === novel.id
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
                                resolvedSelectedNode.type === "comic" &&
                                resolvedSelectedNode.id === comic.id
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
                                resolvedSelectedNode.type === "lyric" &&
                                resolvedSelectedNode.id === music.id
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
                  canManage ? (
                    <Button
                      type="button"
                      size="1"
                      variant="soft"
                      onClick={() => setSelectedNode({ type: "newBook" })}
                    >
                      + Book
                    </Button>
                  ) : undefined
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
                      resolvedSelectedNode.type === "book" &&
                      resolvedSelectedNode.id === book.id
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
            key={getSelectedNodeKey(resolvedSelectedNode)}
            data={data}
            role={role}
            selectedNode={resolvedSelectedNode}
            onSaved={() => router.refresh()}
          />
        </Card>
      </section>
    </div>
  );
};

const getInitialAdminDashboardState = (
  data: AdminDashboardData,
  canManage: boolean,
): StoredAdminDashboardState => {
  const fallback = getFallbackAdminDashboardState(data);
  const stored = readAdminDashboardState();
  if (!stored) return fallback;

  const selectedNode = isValidSelectedNode(stored.selectedNode, data, canManage)
    ? stored.selectedNode
    : fallback.selectedNode;
  const musicIds = new Set(data.musics.map((music) => music.id));
  const expandedMusicIds = stored.expandedMusicIds.filter((musicId) =>
    musicIds.has(musicId),
  );

  return {
    selectedNode,
    expandedMusicIds:
      expandedMusicIds.length > 0 ? expandedMusicIds : fallback.expandedMusicIds,
    scrollTop: stored.scrollTop ?? fallback.scrollTop,
  };
};

const getFallbackAdminDashboardState = (
  data: AdminDashboardData,
): StoredAdminDashboardState => {
  const firstMusicId = data.musics[0]?.id ?? 0;

  return {
    selectedNode: getDefaultSelectedNode(data),
    expandedMusicIds: firstMusicId ? [firstMusicId] : [],
    scrollTop: 0,
  };
};

const getDefaultSelectedNode = (data: AdminDashboardData): SelectedNode => ({
  type: "music",
  id: data.musics[0]?.id ?? 0,
});

const readAdminDashboardState = (): StoredAdminDashboardState | null => {
  try {
    const value = sessionStorage.getItem(ADMIN_DASHBOARD_STATE_KEY);
    if (!value) return null;

    const parsed = JSON.parse(value);
    if (!isStoredAdminDashboardState(parsed)) return null;

    return parsed;
  } catch {
    return null;
  }
};

const saveAdminDashboardState = (state: StoredAdminDashboardState) => {
  try {
    sessionStorage.setItem(ADMIN_DASHBOARD_STATE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage can be unavailable in private contexts.
  }
};

const isStoredAdminDashboardState = (
  value: unknown,
): value is StoredAdminDashboardState => {
  if (!value || typeof value !== "object") return false;

  const state = value as Partial<StoredAdminDashboardState>;
  return (
    isSelectedNode(state.selectedNode) &&
    Array.isArray(state.expandedMusicIds) &&
    state.expandedMusicIds.every((id) => Number.isInteger(id)) &&
    (state.scrollTop == null ||
      (typeof state.scrollTop === "number" && Number.isFinite(state.scrollTop)))
  );
};

const isSelectedNode = (value: unknown): value is SelectedNode => {
  if (!value || typeof value !== "object") return false;

  const node = value as Partial<SelectedNode>;
  if (typeof node.type !== "string") return false;

  switch (node.type) {
    case "music":
    case "novel":
    case "comic":
    case "lyric":
    case "book":
      return Number.isInteger(node.id);
    case "newNovel":
    case "newComic":
    case "newLyric":
      return Number.isInteger(node.musicId);
    case "newMusic":
    case "newBook":
      return true;
    default:
      return false;
  }
};

const isValidSelectedNode = (
  node: SelectedNode,
  data: AdminDashboardData,
  canManage: boolean,
) => {
  switch (node.type) {
    case "music":
      return data.musics.some((music) => music.id === node.id);
    case "novel":
      return data.novels.some((novel) => novel.id === node.id);
    case "comic":
      return data.comics.some((comic) => comic.id === node.id);
    case "lyric":
      return data.lyricTracks.some((track) => track.musicId === node.id);
    case "book":
      return data.books.some((book) => book.id === node.id);
    case "newMusic":
    case "newBook":
      return canManage;
    case "newNovel":
    case "newComic":
      return (
        canManage && data.musics.some((music) => music.id === node.musicId)
      );
    case "newLyric":
      return (
        canManage &&
        data.musics.some((music) => music.id === node.musicId) &&
        !data.lyricTracks.some((track) => track.musicId === node.musicId)
      );
  }
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
