"use client";

import type { LyricPlayer } from "@components/common/YouTubeLyricsPlayer/useLyricPlayer";
import { LyricOverlay } from "@components/common/LyricOverlay";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from "@heroicons/react/24/solid";
import {
  Button,
  Flex,
  IconButton,
  Slider,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import ReactPlayer from "react-player";
import styles from "./LyricTimelineEditor.module.css";
import { formatTime } from "./time";

export const TimelineYouTubePreview = ({ player }: { player: LyricPlayer }) => {
  const {
    currentTime,
    duration,
    shouldPlay,
    togglePlay,
    seekBy,
    effectiveVolume,
    toggleMute,
    changeVolume,
    activeLine,
    showJp,
    showReading,
  } = player;

  return (
    <div className={styles.preview}>
      <div className={styles.previewFrame}>
        <ReactPlayer {...player.playerProps} />
        <div className={styles.previewBlocker} onClick={togglePlay} />
        <div className={styles.previewOverlay}>
          <LyricOverlay
            line={activeLine}
            showJp={showJp}
            showReading={showReading}
            classes={{
              jp: styles.previewOverlayJp,
              reading: styles.previewOverlayReading,
              kr: styles.previewOverlayKr,
            }}
          />
        </div>
      </div>
      <Flex className={styles.previewControls} align="center" gap="2">
        <Button type="button" size="1" variant="soft" onClick={togglePlay}>
          {shouldPlay ? (
            <PauseIcon width="14" height="14" />
          ) : (
            <PlayIcon width="14" height="14" />
          )}
          {shouldPlay ? "일시정지" : "재생"}
        </Button>
        <Text size="1" color="gray">
          {formatTime(currentTime)} / {formatTime(duration)}
        </Text>
        <Flex align="center" gap="1">
          <Tooltip content="0.01초 이전">
            <IconButton
              type="button"
              size="1"
              variant="soft"
              color="gray"
              onClick={() => seekBy(-0.01)}
              disabled={currentTime <= 0}
              aria-label="0.01초 이전으로 이동"
            >
              <ChevronLeftIcon width="14" height="14" />
            </IconButton>
          </Tooltip>
          <Tooltip content="0.01초 이후">
            <IconButton
              type="button"
              size="1"
              variant="soft"
              color="gray"
              onClick={() => seekBy(0.01)}
              disabled={duration > 0 && currentTime >= duration}
              aria-label="0.01초 이후로 이동"
            >
              <ChevronRightIcon width="14" height="14" />
            </IconButton>
          </Tooltip>
        </Flex>
        <Flex className={styles.volumeControl} align="center" gap="2">
          <Tooltip content={effectiveVolume === 0 ? "음소거 해제" : "음소거"}>
            <IconButton
              type="button"
              size="1"
              variant="soft"
              color="gray"
              onClick={toggleMute}
              aria-label={effectiveVolume === 0 ? "음소거 해제" : "음소거"}
            >
              {effectiveVolume === 0 ? (
                <SpeakerXMarkIcon width="14" height="14" />
              ) : (
                <SpeakerWaveIcon width="14" height="14" />
              )}
            </IconButton>
          </Tooltip>
          <Slider
            className={styles.volumeSlider}
            value={[effectiveVolume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={([value]) => changeVolume(value ?? 0)}
            aria-label="볼륨"
          />
          <Text className={styles.volumeValue} size="1" color="gray">
            {Math.round(effectiveVolume * 100)}
          </Text>
        </Flex>
      </Flex>
    </div>
  );
};
