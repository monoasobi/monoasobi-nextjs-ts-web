"use client";

import { LyricOverlay } from "./LyricOverlay";
import type { LyricPlayer } from "./YouTubeLyricsPlayer/useLyricPlayer";
import { formatTime } from "./YouTubeLyricsPlayer/time";
import {
  PauseIcon,
  PlayIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import styles from "./VideoPlayer.module.css";

export const VideoPlayer = ({ player }: { player: LyricPlayer }) => {
  const {
    currentTime,
    duration,
    shouldPlay,
    seek,
    togglePlay,
    effectiveVolume,
    changeVolume,
    showJp,
    showReading,
    toggleJp,
    toggleReading,
    activeLine,
  } = player;
  const volumeWrapperRef = useRef<HTMLDivElement>(null);
  const [showVolumeTooltip, setShowVolumeTooltip] = useState(false);

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
  const volumePct = effectiveVolume * 100;

  return (
    <div className={styles.videoSection}>
      <div className={styles.videoFrame}>
        <div className={styles.iframeWrapper}>
          <ReactPlayer {...player.playerProps} />
        </div>
        <div className={styles.videoBlocker} onClick={togglePlay} />
        <div className={styles.videoGradientOverlay} />
        <div className={styles.videoTopControls}>
          <button
            className={styles.overlayToggleBtn}
            type="button"
            data-active={showJp}
            onClick={toggleJp}
          >
            일어
          </button>
          <button
            className={styles.overlayToggleBtn}
            type="button"
            data-active={showReading}
            onClick={toggleReading}
          >
            발음
          </button>
        </div>
        {activeLine && (
          <div className={styles.videoLyricsOverlay}>
            <LyricOverlay
              line={activeLine}
              showJp={showJp}
              showReading={showReading}
              classes={{
                jp: styles.overlayJp,
                reading: styles.overlayReading,
                kr: styles.overlayKr,
              }}
            />
          </div>
        )}
      </div>
      <div className={styles.controls}>
        <button
          className={styles.controlBtn}
          type="button"
          onClick={togglePlay}
          aria-label={shouldPlay ? "일시정지" : "재생"}
        >
          {shouldPlay ? <PauseIcon /> : <PlayIcon />}
        </button>
        <span className={styles.timeText}>{formatTime(currentTime)}</span>
        <input
          className={styles.seekInput}
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={(event) => seek(Number(event.target.value))}
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
            {effectiveVolume === 0 ? <SpeakerXMarkIcon /> : <SpeakerWaveIcon />}
          </button>
          <div className={styles.volumeTooltip} data-show={showVolumeTooltip}>
            <input
              className={styles.verticalVolumeInput}
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={effectiveVolume}
              onChange={(event) => changeVolume(Number(event.target.value))}
              style={{
                backgroundImage: `linear-gradient(to right, var(--red-9) ${volumePct.toFixed(1)}%, rgba(255,255,255,0.15) ${volumePct.toFixed(1)}%)`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
