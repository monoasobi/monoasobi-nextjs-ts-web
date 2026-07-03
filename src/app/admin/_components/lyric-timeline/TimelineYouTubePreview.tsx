"use client";

import type { LyricLine } from "@appTypes/lyric";
import {
  PauseIcon,
  PlayIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from "@heroicons/react/24/solid";
import { Button, Flex, IconButton, Slider, Text, Tooltip } from "@radix-ui/themes";
import {
  forwardRef,
  useCallback,
  useEffect,
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
const VOLUME_LS_KEY = "monoasobi-video-volume";

const getStoredVolume = () => {
  try {
    const storedVolume = localStorage.getItem(VOLUME_LS_KEY);
    if (storedVolume == null) return 1;

    const volume = Number(storedVolume);
    return Number.isFinite(volume) && volume >= 0 && volume <= 1 ? volume : 1;
  } catch {
    return 1;
  }
};

const setStoredVolume = (volume: number) => {
  try {
    localStorage.setItem(VOLUME_LS_KEY, volume.toString());
  } catch {
    // localStorage can be unavailable in private contexts.
  }
};

export interface TimelineYouTubePreviewHandle {
  seek(time: number): void;
  seekAndPlay(time: number): void;
  seekAndPause(time: number): void;
  play(): void;
  pause(): void;
  togglePlay(): void;
}

interface TimelineYouTubePreviewProps {
  youtubeId: string;
  activeLine: LyricLine | null;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
}

export const TimelineYouTubePreview = forwardRef<
  TimelineYouTubePreviewHandle,
  TimelineYouTubePreviewProps
>(({ youtubeId, activeLine, onTimeUpdate, onDurationChange }, ref) => {
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isReadyRef = useRef(false);
  const hasStartedPlaybackRef = useRef(false);
  const pendingSeekRef = useRef<number | null>(null);
  const shouldPlayRef = useRef(false);
  const [shouldPlay, setShouldPlay] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const setPlayerRef = useCallback((player: HTMLVideoElement | null) => {
    playerRef.current = player;
  }, []);

  useEffect(() => {
    isReadyRef.current = false;
    hasStartedPlaybackRef.current = false;
    pendingSeekRef.current = null;
    shouldPlayRef.current = false;
    setShouldPlay(false);
    setCurrentTime(0);
    setDuration(0);
    stopProgressLoop();
    onTimeUpdate(0);
    onDurationChange(0);
  }, [onDurationChange, onTimeUpdate, youtubeId]);

  useEffect(() => {
    setVolume(getStoredVolume());
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

  const applySeek = (time: number) => {
    const seekTime = Math.max(0, time);
    setCurrentTime(seekTime);
    onTimeUpdate(seekTime);

    const player = playerRef.current;
    if (!player || !isReadyRef.current || !hasStartedPlaybackRef.current) {
      pendingSeekRef.current = seekTime;
      return;
    }

    player.currentTime = seekTime;
    syncTime();
  };

  const play = () => {
    shouldPlayRef.current = true;
    setShouldPlay(true);
    void playerRef.current?.play?.();
  };

  const pause = () => {
    shouldPlayRef.current = false;
    setShouldPlay(false);
    if (hasStartedPlaybackRef.current) {
      void playerRef.current?.pause?.();
    }
  };

  const stopProgressLoop = () => {
    if (animationFrameRef.current == null) return;
    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
  };

  const startProgressLoop = () => {
    stopProgressLoop();

    const tick = () => {
      syncTime();
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  };

  useImperativeHandle(ref, () => ({
    seek(time: number) {
      applySeek(time);
    },
    seekAndPlay(time: number) {
      applySeek(time);
      play();
    },
    seekAndPause(time: number) {
      applySeek(time);
      pause();
    },
    play() {
      play();
    },
    pause() {
      pause();
    },
    togglePlay() {
      if (shouldPlayRef.current) {
        pause();
      } else {
        play();
      }
    },
  }));

  const togglePlay = () => {
    if (shouldPlayRef.current) {
      pause();
    } else {
      play();
    }
  };

  useEffect(() => () => stopProgressLoop(), []);

  return (
    <div className={styles.preview}>
      <div className={styles.previewFrame}>
        <ReactPlayer
          ref={setPlayerRef}
          src={`https://www.youtube.com/watch?v=${youtubeId}`}
          width="100%"
          height="100%"
          playing={shouldPlay}
          volume={volume}
          muted={isMuted}
          config={{ youtube: YOUTUBE_CONFIG }}
          onReady={() => {
            isReadyRef.current = true;
            syncDuration();

            if (hasStartedPlaybackRef.current && pendingSeekRef.current != null) {
              const seekTime = pendingSeekRef.current;
              pendingSeekRef.current = null;
              applySeek(seekTime);
              if (!shouldPlayRef.current) void playerRef.current?.pause?.();
            }
          }}
          onTimeUpdate={syncTime}
          onSeeked={syncTime}
          onDurationChange={syncDuration}
          onPlaying={() => {
            hasStartedPlaybackRef.current = true;

            if (pendingSeekRef.current != null) {
              const seekTime = pendingSeekRef.current;
              pendingSeekRef.current = null;
              const player = playerRef.current;
              if (player) player.currentTime = seekTime;
              syncTime();
            }

            startProgressLoop();
          }}
          onPause={() => {
            stopProgressLoop();
            syncTime();
          }}
          onEnded={() => {
            shouldPlayRef.current = false;
            setShouldPlay(false);
            stopProgressLoop();
          }}
        />
        {activeLine && (
          <div className={styles.previewOverlay}>
            {activeLine.jp && (
              <p className={styles.previewOverlayJp}>{activeLine.jp}</p>
            )}
            {activeLine.jpReading && (
              <p className={styles.previewOverlayReading}>
                {activeLine.jpReading}
              </p>
            )}
            {activeLine.kr && (
              <p className={styles.previewOverlayKr}>{activeLine.kr}</p>
            )}
          </div>
        )}
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
        <Flex className={styles.volumeControl} align="center" gap="2">
          <Tooltip content={isMuted || volume === 0 ? "음소거 해제" : "음소거"}>
            <IconButton
              type="button"
              size="1"
              variant="soft"
              color="gray"
              onClick={() => setIsMuted((prev) => !prev)}
              aria-label={isMuted || volume === 0 ? "음소거 해제" : "음소거"}
            >
              {isMuted || volume === 0 ? (
                <SpeakerXMarkIcon width="14" height="14" />
              ) : (
                <SpeakerWaveIcon width="14" height="14" />
              )}
            </IconButton>
          </Tooltip>
          <Slider
            className={styles.volumeSlider}
            value={[isMuted ? 0 : volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={([nextVolume]) => {
              const safeVolume = nextVolume ?? 0;
              setVolume(safeVolume);
              setStoredVolume(safeVolume);
              if (safeVolume > 0) setIsMuted(false);
            }}
            aria-label="볼륨"
          />
          <Text className={styles.volumeValue} size="1" color="gray">
            {Math.round((isMuted ? 0 : volume) * 100)}
          </Text>
        </Flex>
      </Flex>
    </div>
  );
});

TimelineYouTubePreview.displayName = "TimelineYouTubePreview";
