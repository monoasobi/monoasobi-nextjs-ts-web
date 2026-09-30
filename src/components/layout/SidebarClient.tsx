"use client";

import { Loading } from "@/components/feedback/Loading";
import { useHydrated } from "@/hooks/useHydrated";
import type { Music } from "@appTypes/music";
import type { Novel } from "@appTypes/novel";
import { privateReaderAtom } from "@atoms/privateReader.atom";
import { sidebarAtom, sidebarScrollTopAtom } from "@atoms/sidebar.atom";
import { Badge, Flex, ScrollArea, Text } from "@radix-ui/themes";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { AlbumArtwork } from "@/components/common/AlbumArtwork";
import { getAlbumArtSrc } from "@/lib/albumArt";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import type { MouseEventHandler } from "react";
import { useEffect, useRef } from "react";
import styles from "./Sidebar.module.css";

type ItemTone = "active" | "available" | "untranslated";

export interface SidebarItem {
  music: Music;
  novel: Novel;
}

interface SidebarClientProps {
  items: SidebarItem[];
  isLoading?: boolean;
}

interface ItemProps {
  item: SidebarItem;
  isActive: boolean;
}

export const SidebarClient = ({ items, isLoading = false }: SidebarClientProps) => {
  const [isSidebar, setIsSidebar] = useAtom(sidebarAtom);
  const isHydrated = useHydrated();

  const isSidebarOpen = isHydrated ? isSidebar : false;
  const [sidebarScrollTop, setSidebarScrollTop] = useAtom(sidebarScrollTopAtom);
  const pathname = usePathname();
  const params = useParams<{ id?: string }>();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isSidebarOpen) return;

      const width = window.innerWidth;
      if (
        scrollRef.current &&
        !scrollRef.current.contains(event.target as Node) &&
        width < 1024
      ) {
        setIsSidebar(false);
      }
    };

    const scrollEl = scrollRef.current;

    if (!scrollEl) return;

    scrollEl.scrollTo({ top: sidebarScrollTop });

    const handleScroll = () => {
      setSidebarScrollTop(scrollEl.scrollTop);
    };

    scrollEl.addEventListener("scroll", handleScroll, {
      passive: true,
    });
    document.addEventListener("click", handleClickOutside);
    return () => {
      scrollEl.removeEventListener("scroll", handleScroll);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [
    isSidebar,
    setIsSidebar,
    setSidebarScrollTop,
    sidebarScrollTop,
    isSidebarOpen,
  ]);

  return (
    <>
      <button
        type="button"
        className={styles.overlay}
        data-open={isSidebarOpen}
        aria-hidden={!isSidebarOpen}
        tabIndex={isSidebarOpen ? 0 : -1}
        onClick={() => setIsSidebar(false)}
      />
      <aside className={styles.container} data-open={isSidebarOpen}>
        <ScrollArea
          ref={scrollRef}
          type="auto"
          scrollbars="vertical"
          className={styles.scrollArea}
        >
          {isLoading && <Loading label="목록을 불러오는 중입니다." />}
          <Flex direction="column" gap="1">
            {items.map((item) => (
              <Item
                item={item}
                key={item.music.id}
                isActive={
                  item.music.specialPath
                    ? pathname.includes(item.music.specialPath)
                    : params.id === String(item.novel.id)
                }
              />
            ))}
          </Flex>
        </ScrollArea>
      </aside>
    </>
  );
};

const getTone = ({
  isActive,
  specialPath,
  translated,
  isPublished,
}: {
  isActive: boolean;
  specialPath?: string;
  translated?: boolean;
  isPublished?: boolean;
}): ItemTone => {
  if (isActive) return "active";
  if (specialPath || translated || isPublished) return "available";
  return "untranslated";
};

const Item = ({ item, isActive }: ItemProps) => {
  const { music, novel } = item;
  const { korTitle, title, enTitle, specialPath } = music;
  const setIsSidebar = useSetAtom(sidebarAtom);

  const hasPrivateReaderAccess = useAtomValue(privateReaderAtom);

  const { isPublished, translated, title: novelTitle } = novel;
  const closeHandler: MouseEventHandler<HTMLAnchorElement> = () => {
    if (window.innerWidth < 1024) setIsSidebar(false);
  };

  const href = specialPath ? `/${specialPath}` : `/novel/${novel.id}`;
  const tone = getTone({ isActive, specialPath, translated, isPublished });
  const showPublishedBadge =
    isPublished && !hasPrivateReaderAccess && !specialPath;

  return (
    <Link
      href={href}
      onClick={closeHandler}
      title={`${title} - ${korTitle} / ${enTitle}`}
      className={styles.item}
      data-active={isActive}
      data-tone={tone}
    >
      <AlbumArtwork
        src={getAlbumArtSrc(music)}
        alt={music.title}
        className={styles.artwork}
      />
      <span className={styles.itemText}>
        <span className={styles.textRow}>
          <Text as="span" size="3" weight="bold" truncate>
            {title}
          </Text>
          {showPublishedBadge && <Badge size="1">정식 발매</Badge>}
        </span>
        <Text as="span" size="1" weight="bold" truncate>
          {korTitle} / {enTitle}
        </Text>
        {novelTitle && (
          <Text as="span" size="1" truncate>
            &lt;{novelTitle}&gt;
          </Text>
        )}
      </span>
    </Link>
  );
};
