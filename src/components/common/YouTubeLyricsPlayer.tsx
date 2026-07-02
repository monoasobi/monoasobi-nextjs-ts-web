"use client";

import type { LyricTrack } from "@appTypes/lyric";
import type { Music } from "@appTypes/music";
import { LyricsDisplayV2 } from "@components/common/LyricsDisplayV2";
import {
  Button,
  Card,
  Flex,
  Heading,
  Popover,
  ScrollArea,
  Text,
} from "@radix-ui/themes";
import { useMemo, useRef, useState } from "react";
import { VideoPlayer, type VideoPlayerHandle } from "./VideoPlayer";
import styles from "./YouTubeLyricsPlayer.module.css";

const OFFSET_STEPS = [0.01, 0.05, 0.1, 0.5];

export interface YouTubeLyricsPlayerProps {
  music: Music;
  lyricTrack: LyricTrack | null;
}

export const YouTubeLyricsPlayer = ({
  music,
  lyricTrack,
}: YouTubeLyricsPlayerProps) => {
  const videoPlayerRef = useRef<VideoPlayerHandle>(null);
  const track = lyricTrack;
  const [lyricsOffset, setLyricsOffset] = useState(track?.sync ?? 0);
  const [currentTime, setCurrentTime] = useState(0);

  const activeLine = useMemo(
    () =>
      track?.lyric.find(
        (line) =>
          currentTime >= line.start + lyricsOffset &&
          currentTime < line.end + lyricsOffset,
      ) ?? null,
    [currentTime, lyricsOffset, track],
  );

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    videoPlayerRef.current?.seekAndPlay(time);
  };

  const handleOffsetChange = (delta: number) => {
    setLyricsOffset((prev) => Number((prev + delta).toFixed(2)));
  };

  const resetOffset = () => {
    setLyricsOffset(track?.sync ?? 0);
  };

  const syncLabel =
    lyricsOffset !== 0
      ? `sync ${lyricsOffset >= 0 ? "+" : ""}${lyricsOffset.toFixed(2)}`
      : "sync";

  return (
    <ScrollArea className={styles.container} scrollbars="vertical">
      <Flex direction="column" gap="3">
        <Flex className={styles.innerContainer} direction="column" gap="3">
          <Flex direction="column" gap="3">
            <Flex justify="between" gap="3" wrap="wrap">
              <Flex direction="row" align="end" gap="1" wrap="wrap">
                <Heading size="4">{music.title}</Heading>
                <Text size="2" color="gray">
                  {music.korTitle}
                </Text>
              </Flex>

              {process.env.NODE_ENV === "development" && (
                <Popover.Root>
                  <Popover.Trigger>
                    <Button size="1" variant="soft" color="gray">
                      {syncLabel}
                    </Button>
                  </Popover.Trigger>
                  <Popover.Content width="260px">
                    <Flex direction="column" gap="3">
                      <Flex align="center" justify="between">
                        <Text size="2" weight="bold">
                          SYNC
                        </Text>
                        <Text
                          className={styles.syncValue}
                          size="2"
                          color="gray"
                        >
                          {lyricsOffset >= 0 ? "+" : ""}
                          {lyricsOffset.toFixed(2)}s
                        </Text>
                      </Flex>
                      <Flex gap="1" wrap="wrap">
                        {OFFSET_STEPS.map((step) => (
                          <Button
                            key={`minus-${step}`}
                            type="button"
                            size="1"
                            variant="outline"
                            color="gray"
                            onClick={() => handleOffsetChange(-step)}
                          >
                            -{step}
                          </Button>
                        ))}
                      </Flex>
                      <Flex gap="1" wrap="wrap">
                        {OFFSET_STEPS.map((step) => (
                          <Button
                            key={`plus-${step}`}
                            type="button"
                            size="1"
                            variant="outline"
                            color="gray"
                            onClick={() => handleOffsetChange(step)}
                          >
                            +{step}
                          </Button>
                        ))}
                      </Flex>
                      <Button
                        type="button"
                        size="1"
                        variant="soft"
                        color="red"
                        onClick={resetOffset}
                      >
                        reset
                      </Button>
                    </Flex>
                  </Popover.Content>
                </Popover.Root>
              )}
            </Flex>

            {music.youtubeId ? (
              <VideoPlayer
                ref={videoPlayerRef}
                youtubeId={music.youtubeId}
                activeLine={activeLine}
                onTimeUpdate={setCurrentTime}
              />
            ) : (
              <Card className={styles.statusCard}>
                <Text size="2" color="gray">
                  등록된 YouTube 영상이 없습니다.
                </Text>
              </Card>
            )}
          </Flex>
        </Flex>

        {track && (
          <LyricsDisplayV2
            lyrics={track.lyric}
            currentTime={currentTime}
            offset={lyricsOffset}
            onSeek={handleSeek}
          />
        )}

        {!track && (
          <Card className={styles.statusCard}>
            <Text size="2" color="gray">
              이 곡의 가사 파일은 아직 준비되지 않았습니다.
            </Text>
          </Card>
        )}
      </Flex>
    </ScrollArea>
  );
};
