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
import { VideoPlayer } from "./VideoPlayer";
import styles from "./YouTubeLyricsPlayer.module.css";
import { useLyricPlayer } from "./YouTubeLyricsPlayer/useLyricPlayer";

const OFFSET_STEPS = [0.01, 0.05, 0.1, 0.5];

export interface YouTubeLyricsPlayerProps {
  music: Music;
  lyricTrack: LyricTrack | null;
}

export const YouTubeLyricsPlayer = ({
  music,
  lyricTrack,
}: YouTubeLyricsPlayerProps) => {
  const track = lyricTrack;
  const player = useLyricPlayer({
    youtubeId: music.youtubeId ?? "",
    lyrics: track?.lyric,
    sync: track?.sync ?? 0,
  });
  const {
    offset: lyricsOffset,
    activeLineIndex,
    adjustOffset: handleOffsetChange,
    resetOffset,
  } = player;

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
              <VideoPlayer player={player} />
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
            activeIndex={activeLineIndex}
            offset={lyricsOffset}
            onSeek={player.seekAndPlay}
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
