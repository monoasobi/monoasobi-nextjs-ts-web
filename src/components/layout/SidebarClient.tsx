"use client";

import type { Music } from "@appTypes/music";
import type { Novel } from "@appTypes/novel";
import { privateReaderAtom } from "@atoms/privateReader.atom";
import { sidebarAtom, sidebarScrollTopAtom } from "@atoms/sidebar.atom";
import { Badge, Flex, ScrollArea, Text } from "@radix-ui/themes";
import { useAtomValue, useSetAtom } from "jotai";
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
}

interface ItemProps {
  item: SidebarItem;
  isActive: boolean;
}

export const SidebarClient = ({ items }: SidebarClientProps) => {
  const isSidebar = useAtomValue(sidebarAtom);
  const setIsSidebar = useSetAtom(sidebarAtom);
  const sidebarScrollTop = useAtomValue(sidebarScrollTopAtom);
  const pathname = usePathname();
  const params = useParams<{ id?: string }>();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isSidebar) return;

      const width = window.innerWidth;
      if (
        scrollRef.current &&
        !scrollRef.current.contains(event.target as Node) &&
        width < 1024
      ) {
        setIsSidebar(false);
      }
    };

    if (sidebarScrollTop) {
      scrollRef.current?.scrollTo({ top: sidebarScrollTop - 100 });
    }

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isSidebar, setIsSidebar, sidebarScrollTop]);

  return (
    <>
      <button
        type="button"
        className={styles.overlay}
        data-open={isSidebar}
        aria-hidden={!isSidebar}
        tabIndex={isSidebar ? 0 : -1}
        onClick={() => setIsSidebar(false)}
      />
      <aside className={styles.container} data-open={isSidebar}>
        <ScrollArea
          ref={scrollRef}
          type="auto"
          scrollbars="vertical"
          className={styles.scrollArea}
        >
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
  const setSidebarScrollTop = useSetAtom(sidebarScrollTopAtom);
  const hasPrivateReaderAccess = useAtomValue(privateReaderAtom);

  const { isPublished, translated, title: novelTitle } = novel;
  const closeHandler: MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (window.innerWidth < 1024) setIsSidebar(false);
    setSidebarScrollTop(event.currentTarget.offsetTop);
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/images/albumart/${music.id}.webp`}
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
