"use client";

import {
  useCallback,
  type Dispatch,
  type RefObject,
  type SetStateAction,
  type WheelEvent,
} from "react";
import {
  MAX_PIXELS_PER_SECOND,
  MIN_PIXELS_PER_SECOND,
  clamp,
} from "../time";
import { ZOOM_FACTOR } from "./timelineUtils";

interface UseTimelineZoomParams {
  currentTime: number;
  pixelsPerSecond: number;
  setPixelsPerSecond: Dispatch<SetStateAction<number>>;
  timelineRef: RefObject<HTMLDivElement | null>;
  timelineStart: number;
}

export const useTimelineZoom = ({
  currentTime,
  pixelsPerSecond,
  setPixelsPerSecond,
  timelineRef,
  timelineStart,
}: UseTimelineZoomParams) => {
  const getAnchorTime = useCallback(
    (clientX?: number) => {
      const timeline = timelineRef.current;
      if (!timeline) return currentTime || 0;

      const rect = timeline.getBoundingClientRect();
      const x = clientX == null ? rect.width / 2 : clientX - rect.left;
      return timelineStart + (timeline.scrollLeft + x) / pixelsPerSecond;
    },
    [currentTime, pixelsPerSecond, timelineRef, timelineStart],
  );

  const zoomTimeline = useCallback(
    (nextPixels: number, anchorTime = getAnchorTime()) => {
      const timeline = timelineRef.current;
      const nextPixelsPerSecond = clamp(
        nextPixels,
        MIN_PIXELS_PER_SECOND,
        MAX_PIXELS_PER_SECOND,
      );

      if (!timeline) {
        setPixelsPerSecond(nextPixelsPerSecond);
        return;
      }

      const rect = timeline.getBoundingClientRect();
      const anchorX =
        anchorTime === currentTime
          ? rect.width / 2
          : (anchorTime - timelineStart) * pixelsPerSecond -
            timeline.scrollLeft;

      setPixelsPerSecond(nextPixelsPerSecond);

      requestAnimationFrame(() => {
        timeline.scrollLeft =
          (anchorTime - timelineStart) * nextPixelsPerSecond - anchorX;
      });
    },
    [
      currentTime,
      getAnchorTime,
      pixelsPerSecond,
      setPixelsPerSecond,
      timelineRef,
      timelineStart,
    ],
  );

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!event.metaKey) return;
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    const factor = Math.pow(ZOOM_FACTOR, direction);
    zoomTimeline(pixelsPerSecond * factor, getAnchorTime(event.clientX));
  };

  return {
    handleWheel,
    zoomTimeline,
  };
};
