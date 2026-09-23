"use client";

import type { LyricLine } from "@appTypes/lyric";
import { useMemo } from "react";
import { getDisplayStart, getDisplayEnd } from "./time";

export const useActiveLyric = (
  lyrics: LyricLine[] | undefined,
  currentTime: number,
  offset: number,
) => {
  const activeLineIndex = useMemo(
    () =>
      lyrics?.findIndex(
        (line) =>
          currentTime >= getDisplayStart(line, offset) &&
          currentTime < getDisplayEnd(line, offset),
      ) ?? -1,
    [lyrics, currentTime, offset],
  );

  return {
    activeLineIndex,
    activeLine: lyrics?.[activeLineIndex] ?? null,
  };
};
