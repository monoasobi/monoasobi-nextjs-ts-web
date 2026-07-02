"use client";

import type { LyricTrack } from "@appTypes/lyric";
import type { Music } from "@appTypes/music";
import { YouTubeLyricsPlayer } from "@components/common/YouTubeLyricsPlayer";
import { MusicalNoteIcon } from "@heroicons/react/16/solid";
import {
  BookOpenIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  Card,
  DataList,
  Flex,
  Heading,
  IconButton,
  Popover,
  Text,
} from "@radix-ui/themes";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import styles from "./ContentsContainer.module.css";

interface ContentsContainerProps {
  children: ReactNode;
  music: Music;
  lyricTrack?: LyricTrack | null;
  content?: {
    title: string;
    writer: string;
    originUrl: string;
    translator?: string;
    translatorUrl?: string;
  };
}

export const ContentsContainer = ({
  children,
  music,
  lyricTrack = null,
  content,
}: ContentsContainerProps) => {
  const { title, korTitle } = music;
  const router = useRouter();
  const searchParams = useSearchParams();
  const isLyrics = searchParams.get("view") === "lyrics";

  const handleTabChange = () => {
    router.replace(isLyrics ? "?" : "?view=lyrics", { scroll: false });
  };

  return (
    <Popover.Root>
      <Flex className={styles.container} direction="column" align="center">
        <Card className={styles.header} variant="surface">
          <Flex className={styles.headerInfo} direction="column" align="center">
            <Text
              className={styles.headerTitle}
              size="2"
              weight="bold"
              color="red"
              truncate
            >
              {korTitle} {korTitle !== title && title}
            </Text>
            {content?.title && (
              <Heading className={styles.headerHeading} size="2" truncate>
                {content.writer} &lt;{content.title}&gt;
              </Heading>
            )}
          </Flex>
          <Flex gap="2" className={styles.headerButton}>
            <Popover.Trigger>
              <IconButton size="1" variant="soft" aria-label="작품 정보">
                <EllipsisHorizontalIcon width="16" height="16" />
              </IconButton>
            </Popover.Trigger>
          </Flex>
          <Popover.Content maxWidth="320px">
            <Flex direction="column" gap="3">
              <DataList.Root>
                {content?.translator && content?.translatorUrl && (
                  <DataList.Item align="center">
                    <DataList.Label minWidth="32px">역자</DataList.Label>
                    <DataList.Value>
                      <Button variant="outline" size="1" asChild>
                        <Link href={content.translatorUrl} target="_blank">
                          {content.translator}
                        </Link>
                      </Button>
                    </DataList.Value>
                  </DataList.Item>
                )}
                {content?.originUrl && (
                  <DataList.Item align="center">
                    <DataList.Label minWidth="32px">원문</DataList.Label>
                    <DataList.Value>
                      <Button variant="outline" size="1" asChild>
                        <Link href={content.originUrl} target="_blank">
                          보러가기
                        </Link>
                      </Button>
                    </DataList.Value>
                  </DataList.Item>
                )}
              </DataList.Root>
            </Flex>
          </Popover.Content>
        </Card>
        {isLyrics ? (
          <YouTubeLyricsPlayer
            key={music.id}
            music={music}
            lyricTrack={lyricTrack}
          />
        ) : (
          children
        )}
        <IconButton
          className={styles.floatingToggle}
          size="3"
          variant="solid"
          onClick={handleTabChange}
          aria-label={isLyrics ? "본문 보기" : "가사 보기"}
        >
          {isLyrics ? (
            <BookOpenIcon width="20" height="20" />
          ) : (
            <MusicalNoteIcon width="20" height="20" />
          )}
        </IconButton>
      </Flex>
    </Popover.Root>
  );
};
