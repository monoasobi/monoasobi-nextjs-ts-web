"use client";

import { useEffect, type RefObject } from "react";
import type { TimelineYouTubePreviewHandle } from "../TimelineYouTubePreview";
import { ZOOM_FACTOR, isButtonTarget, isEditableTarget } from "./timelineUtils";

interface UseTimelineShortcutsParams {
  activeLineIndex: number;
  pixelsPerSecond: number;
  previewRef: RefObject<TimelineYouTubePreviewHandle | null>;
  onActiveLineSelect: (index: number) => void;
  onZoom: (pixelsPerSecond: number) => void;
}

export const useTimelineShortcuts = ({
  activeLineIndex,
  pixelsPerSecond,
  previewRef,
  onActiveLineSelect,
  onZoom,
}: UseTimelineShortcutsParams) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isEditable = isEditableTarget(event.target);

      if (event.code === "Space") {
        if (isEditable) return;

        event.preventDefault();
        event.stopPropagation();
        previewRef.current?.togglePlay();
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
    previewRef,
  ]);
};
