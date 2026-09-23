"use client";

import type { LyricLine } from "@appTypes/lyric";
import { useState } from "react";
import { useYouTubePlayback } from "../VideoPlayer/useYouTubePlayback";
import { usePlayerVolume } from "../VideoPlayer/usePlayerVolume";
import { useActiveLyric } from "./useActiveLyric";
import { roundTime } from "./time";

const YOUTUBE_CONFIG = {
  youtube: {
    color: "white" as const,
    rel: 0 as const,
    controls: 0,
    fs: 0 as const,
    cc_load_policy: 0 as const,
  },
};

interface LyricPlayerOptions {
  youtubeId: string;
  lyrics?: LyricLine[];
  sync: number;
  showReading?: boolean;
}

// Both screens own one controller. Editing adds commands, not another playback path.
export const useLyricPlayer = ({
  youtubeId,
  lyrics,
  sync,
  showReading: initialShowReading = false,
}: LyricPlayerOptions) => {
  const playback = useYouTubePlayback(youtubeId);
  const audio = usePlayerVolume();
  const [override, setOverride] = useState<{
    source: string;
    base: number;
    value: number;
  } | null>(null);
  const offset =
    override?.source === youtubeId && override.base === sync
      ? override.value
      : sync;
  const setOffset = (value: number) => {
    if (Number.isFinite(value))
      setOverride({ source: youtubeId, base: sync, value: roundTime(value) });
  };
  const [showJp, setShowJp] = useState(true);
  const [showReading, setShowReading] = useState(initialShowReading);
  const active = useActiveLyric(lyrics, playback.currentTime, offset);

  return {
    ...playback,
    ...audio,
    ...active,
    offset,
    setOffset,
    adjustOffset: (delta: number) => setOffset(offset + delta),
    resetOffset: () => setOverride(null),
    showJp,
    showReading,
    toggleJp: () => setShowJp((value) => !value),
    toggleReading: () => setShowReading((value) => !value),
    playerProps: {
      ref: playback.setPlayerRef,
      src: `https://www.youtube.com/watch?v=${youtubeId}`,
      width: "100%",
      height: "100%",
      playing: playback.shouldPlay,
      volume: audio.volume,
      muted: audio.isMuted,
      controls: false,
      playsInline: true,
      config: YOUTUBE_CONFIG,
      ...playback.playerEvents,
    },
  };
};

export type LyricPlayer = ReturnType<typeof useLyricPlayer>;
