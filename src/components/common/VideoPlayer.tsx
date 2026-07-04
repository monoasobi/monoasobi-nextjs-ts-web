"use client";

import type { LyricLine } from "@appTypes/lyric";
import {
  PauseIcon,
  PlayIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from "@heroicons/react/24/solid";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import ReactPlayer from "react-player";
import styles from "./VideoPlayer.module.css";

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

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export interface VideoPlayerHandle {
  seekAndPlay(time: number): void;
}

export interface VideoPlayerProps {
  youtubeId: string;
  activeLine: LyricLine | null;
  onTimeUpdate: (time: number) => void;
}

export const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  ({ youtubeId, activeLine, onTimeUpdate }, ref) => {
    const playerRef = useRef<HTMLVideoElement | null>(null);
    const volumeWrapperRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(getStoredVolume);
    const [isMuted, setIsMuted] = useState(false);
    const [showVolumeTooltip, setShowVolumeTooltip] = useState(false);
    const [showJp, setShowJp] = useState(true);
    const [showReading, setShowReading] = useState(false);

    const setPlayerRef = useCallback((player: HTMLVideoElement | null) => {
      playerRef.current = player;
    }, []);

    const syncTime = useCallback(() => {
      const player = playerRef.current;
      if (!player) return;
      const time = Number(player.currentTime.toFixed(3));
      setCurrentTime(time);
      onTimeUpdate(time);
    }, [onTimeUpdate]);

    const stopProgressLoop = useCallback(() => {
      if (animationFrameRef.current == null) return;
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }, []);

    const startProgressLoop = useCallback(() => {
      stopProgressLoop();

      const tick = () => {
        syncTime();
        animationFrameRef.current = requestAnimationFrame(tick);
      };

      animationFrameRef.current = requestAnimationFrame(tick);
    }, [stopProgressLoop, syncTime]);

    useEffect(() => {
      stopProgressLoop();
      setCurrentTime(0);
      setIsPlaying(false);
      setDuration(0);
      onTimeUpdate(0);
    }, [onTimeUpdate, stopProgressLoop, youtubeId]);

    useEffect(() => () => stopProgressLoop(), [stopProgressLoop]);

    useImperativeHandle(ref, () => ({
      seekAndPlay(time: number) {
        const player = playerRef.current;
        if (!player) return;
        player.currentTime = time;
        setCurrentTime(time);
        onTimeUpdate(time);
        void player.play?.();
      },
    }));

    const handleDurationChange = () => {
      const player = playerRef.current;
      if (!player) return;
      setDuration(player.duration ?? 0);
    };

    const handleTogglePlay = () => {
      const player = playerRef.current;
      if (!player) return;
      if (isPlaying) {
        void player.pause?.();
      } else {
        void player.play?.();
      }
    };

    const handleSeekChange = (e: ChangeEvent<HTMLInputElement>) => {
      const time = Number(e.target.value);
      const player = playerRef.current;
      if (!player) return;
      player.currentTime = time;
      setCurrentTime(time);
      onTimeUpdate(time);
    };

    const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value);
      setVolume(value);
      setStoredVolume(value);
      if (isMuted && value > 0) setIsMuted(false);
    };

    const handleVolumeButtonClick = () => {
      setShowVolumeTooltip((prev) => !prev);
    };

    useEffect(() => {
      if (!showVolumeTooltip) return;
      const handleOutside = (e: MouseEvent | TouchEvent) => {
        if (
          volumeWrapperRef.current &&
          !volumeWrapperRef.current.contains(e.target as Node)
        ) {
          setShowVolumeTooltip(false);
        }
      };
      document.addEventListener("mousedown", handleOutside);
      document.addEventListener("touchstart", handleOutside);
      return () => {
        document.removeEventListener("mousedown", handleOutside);
        document.removeEventListener("touchstart", handleOutside);
      };
    }, [showVolumeTooltip]);

    const seekPct = duration > 0 ? (currentTime / duration) * 100 : 0;
    const volumePct = isMuted ? 0 : volume * 100;

    return (
      <div className={styles.videoSection}>
        <div className={styles.videoFrame}>
          <div className={styles.iframeWrapper}>
            <ReactPlayer
              ref={setPlayerRef}
              src={`https://www.youtube.com/watch?v=${youtubeId}`}
              width="100%"
              height="100%"
              volume={volume}
              muted={isMuted}
              config={{ youtube: YOUTUBE_CONFIG }}
              onTimeUpdate={syncTime}
              onSeeked={syncTime}
              onDurationChange={handleDurationChange}
              onPlay={() => {
                setIsPlaying(true);
                startProgressLoop();
              }}
              onPause={() => {
                setIsPlaying(false);
                stopProgressLoop();
                syncTime();
              }}
              onEnded={() => {
                setIsPlaying(false);
                stopProgressLoop();
              }}
            />
          </div>
          <div className={styles.videoBlocker} onClick={handleTogglePlay} />
          <div className={styles.videoGradientOverlay} />
          <div className={styles.videoTopControls}>
            <button
              className={styles.overlayToggleBtn}
              type="button"
              data-active={showJp}
              onClick={() => setShowJp((prev) => !prev)}
            >
              일어
            </button>
            <button
              className={styles.overlayToggleBtn}
              type="button"
              data-active={showReading}
              onClick={() => setShowReading((prev) => !prev)}
            >
              발음
            </button>
          </div>
          {activeLine && (
            <div className={styles.videoLyricsOverlay}>
              {showJp && activeLine.jp && (
                <p className={styles.overlayJp}>{activeLine.jp}</p>
              )}
              {showReading && activeLine.jpReading && (
                <p className={styles.overlayReading}>{activeLine.jpReading}</p>
              )}
              {activeLine.kr && (
                <p className={styles.overlayKr}>{activeLine.kr}</p>
              )}
            </div>
          )}
        </div>
        <div className={styles.controls}>
          <button
            className={styles.controlBtn}
            type="button"
            onClick={handleTogglePlay}
            aria-label={isPlaying ? "일시정지" : "재생"}
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          <span className={styles.timeText}>{formatTime(currentTime)}</span>
          <input
            className={styles.seekInput}
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={handleSeekChange}
            style={{
              backgroundImage: `linear-gradient(to right, var(--red-9) ${seekPct.toFixed(1)}%, rgba(255,255,255,0.15) ${seekPct.toFixed(1)}%)`,
            }}
          />
          <span className={styles.timeText}>{formatTime(duration)}</span>
          <div className={styles.volumeWrapper} ref={volumeWrapperRef}>
            <button
              className={styles.controlBtn}
              type="button"
              onClick={handleVolumeButtonClick}
              aria-label="볼륨 조절"
            >
              {isMuted || volume === 0 ? (
                <SpeakerXMarkIcon />
              ) : (
                <SpeakerWaveIcon />
              )}
            </button>
            <div className={styles.volumeTooltip} data-show={showVolumeTooltip}>
              <input
                className={styles.verticalVolumeInput}
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                style={{
                  backgroundImage: `linear-gradient(to right, var(--red-9) ${volumePct.toFixed(1)}%, rgba(255,255,255,0.15) ${volumePct.toFixed(1)}%)`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  },
);

VideoPlayer.displayName = "VideoPlayer";
