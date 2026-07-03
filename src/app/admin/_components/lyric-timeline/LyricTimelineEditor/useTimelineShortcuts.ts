"use client";

import { useEffect, type RefObject } from "react";
import type { TimelineYouTubePreviewHandle } from "../TimelineYouTubePreview";
import { ZOOM_FACTOR, isEditableTarget } from "./timelineUtils";

interface UseTimelineShortcutsParams {
  activeLineIndex: number;
  isTimelineHot: boolean;
  pixelsPerSecond: number;
  previewRef: RefObject<TimelineYouTubePreviewHandle | null>;
  onActiveLineSelect: (index: number) => void;
  onZoom: (pixelsPerSecond: number) => void;
}

export const useTimelineShortcuts = ({
  activeLineIndex,
  isTimelineHot,
  pixelsPerSecond,
  previewRef,
  onActiveLineSelect,
  onZoom,
}: UseTimelineShortcutsParams) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isTimelineHot || isEditableTarget(event.target)) return;

      if (event.code === "Space") {
        event.preventDefault();
        previewRef.current?.togglePlay();
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

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeLineIndex,
    isTimelineHot,
    onActiveLineSelect,
    onZoom,
    pixelsPerSecond,
    previewRef,
  ]);
};
