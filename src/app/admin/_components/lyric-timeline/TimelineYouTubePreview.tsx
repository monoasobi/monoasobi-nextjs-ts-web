"use client";

import { PauseIcon, PlayIcon } from "@heroicons/react/24/solid";
import { Button, Flex, Text } from "@radix-ui/themes";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import ReactPlayer from "react-player";
import { formatTime } from "./time";
import styles from "./LyricTimelineEditor.module.css";

const YOUTUBE_CONFIG = {
  color: "white" as const,
  rel: 0 as const,
  controls: 0,
};

export interface TimelineYouTubePreviewHandle {
  seek(time: number): void;
  seekAndPlay(time: number): void;
  play(): void;
  pause(): void;
  togglePlay(): void;
}

interface TimelineYouTubePreviewProps {
  youtubeId: string;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
}

export const TimelineYouTubePreview = forwardRef<
  TimelineYouTubePreviewHandle,
  TimelineYouTubePreviewProps
>(({ youtubeId, onTimeUpdate, onDurationChange }, ref) => {
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const setPlayerRef = useCallback((player: HTMLVideoElement | null) => {
    playerRef.current = player;
  }, []);

  const syncTime = () => {
    const player = playerRef.current;
    if (!player) return;

    const nextTime = Number(player.currentTime.toFixed(3));
    setCurrentTime(nextTime);
    onTimeUpdate(nextTime);
  };

  const syncDuration = () => {
    const player = playerRef.current;
    if (!player) return;

    const nextDuration = player.duration || 0;
    setDuration(nextDuration);
    onDurationChange(nextDuration);
  };

  useImperativeHandle(ref, () => ({
    seek(time: number) {
      const player = playerRef.current;
      if (!player) return;
      player.currentTime = Math.max(0, time);
      syncTime();
    },
    seekAndPlay(time: number) {
      const player = playerRef.current;
      if (!player) return;
      player.currentTime = Math.max(0, time);
      void player.play?.();
      syncTime();
    },
    play() {
      void playerRef.current?.play?.();
    },
    pause() {
      void playerRef.current?.pause?.();
    },
    togglePlay() {
      const player = playerRef.current;
      if (!player) return;

      if (isPlaying) {
        void player.pause?.();
      } else {
        void player.play?.();
      }
    },
  }));

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;

    if (isPlaying) {
      void player.pause?.();
    } else {
      void player.play?.();
    }
  };

  return (
    <div className={styles.preview}>
      <div className={styles.previewFrame}>
        <ReactPlayer
          ref={setPlayerRef}
          src={`https://www.youtube.com/watch?v=${youtubeId}`}
          width="100%"
          height="100%"
          config={{ youtube: YOUTUBE_CONFIG }}
          onTimeUpdate={syncTime}
          onSeeked={syncTime}
          onDurationChange={syncDuration}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
      </div>
      <Flex className={styles.previewControls} align="center" gap="2">
        <Button type="button" size="1" variant="soft" onClick={togglePlay}>
          {isPlaying ? (
            <PauseIcon width="14" height="14" />
          ) : (
            <PlayIcon width="14" height="14" />
          )}
          {isPlaying ? "일시정지" : "재생"}
        </Button>
        <Text size="1" color="gray">
          {formatTime(currentTime)} / {formatTime(duration)}
        </Text>
      </Flex>
    </div>
  );
});

TimelineYouTubePreview.displayName = "TimelineYouTubePreview";
