"use client";

import { useEffect } from "react";
import type { LyricPlayer } from "@components/common/YouTubeLyricsPlayer/useLyricPlayer";
import { ZOOM_FACTOR, isButtonTarget, isEditableTarget } from "./timelineUtils";

interface UseTimelineShortcutsParams {
  activeLineIndex: number;
  pixelsPerSecond: number;
  player: Pick<LyricPlayer, "togglePlay" | "seekBy">;
  onActiveLineSelect: (index: number) => void;
  onZoom: (pixelsPerSecond: number) => void;
}

export const useTimelineShortcuts = ({
  activeLineIndex,
  pixelsPerSecond,
  player,
  onActiveLineSelect,
  onZoom,
}: UseTimelineShortcutsParams) => {
  const { togglePlay, seekBy } = player;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isEditable = isEditableTarget(event.target);

      if (event.code === "Space") {
        if (isEditable) return;

        event.preventDefault();
        event.stopPropagation();
        togglePlay();
        return;
      }

      if (
        !isEditable &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        (event.key === "ArrowLeft" || event.key === "ArrowRight")
      ) {
        event.preventDefault();
        event.stopPropagation();
        seekBy(event.key === "ArrowLeft" ? -0.01 : 0.01);
        return;
      }

      if (isEditable || isButtonTarget(event.target)) {
        return;
      }

      if (event.code === "Enter" && activeLineIndex >= 0) {
        event.preventDefault();
        onActiveLineSelect(activeLineIndex);
      }

      if (event.metaKey && (event.key === "=" || event.key === "+")) {
        event.preventDefault();
        onZoom(pixelsPerSecond * ZOOM_FACTOR);
      }

      if (event.metaKey && event.key === "-") {
        event.preventDefault();
        onZoom(pixelsPerSecond / ZOOM_FACTOR);
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [
    activeLineIndex,
    onActiveLineSelect,
    onZoom,
    pixelsPerSecond,
    togglePlay,
    seekBy,
  ]);
};
