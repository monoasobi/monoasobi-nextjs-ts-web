"use client";

import type { LyricLine } from "@appTypes/lyric";
import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type MouseEvent as ReactMouseEvent,
  type SetStateAction,
} from "react";
import { MIN_LINE_DURATION, clamp, roundTime } from "../time";

export type TimelineEdge = "start" | "end";

type DragState = {
  index: number;
  edge: TimelineEdge;
  startX: number;
  lyrics: LyricLine[];
};

interface UseTimelineResizeParams {
  draftLyrics: LyricLine[];
  pixelsPerSecond: number;
  setDraftLyrics: Dispatch<SetStateAction<LyricLine[]>>;
}

export const useTimelineResize = ({
  draftLyrics,
  pixelsPerSecond,
  setDraftLyrics,
}: UseTimelineResizeParams) => {
  const dragRef = useRef<DragState | null>(null);

  const resizeLineStart = useCallback(
    (index: number, nextStart: number, sourceLyrics = draftLyrics) => {
      const next = sourceLyrics.map((line) => ({ ...line }));
      const line = next[index];
      if (!line) return sourceLyrics;

      const minStart =
        index > 0 ? next[index - 1].start + MIN_LINE_DURATION : 0;
      const maxStart = line.end - MIN_LINE_DURATION;
      const start = roundTime(clamp(nextStart, minStart, maxStart));

      line.start = start;
      if (index > 0 && next[index - 1].end > start) {
        next[index - 1].end = start;
      }

      return next;
    },
    [draftLyrics],
  );

  const resizeLineEnd = useCallback(
    (index: number, nextEnd: number, sourceLyrics = draftLyrics) => {
      const next = sourceLyrics.map((line) => ({ ...line }));
      const line = next[index];
      if (!line) return sourceLyrics;

      const minEnd = line.start + MIN_LINE_DURATION;
      const maxEnd =
        index < next.length - 1
          ? next[index + 1].end - MIN_LINE_DURATION
          : Number.POSITIVE_INFINITY;
      const end = roundTime(clamp(nextEnd, minEnd, maxEnd));

      line.end = end;
      if (index < next.length - 1 && next[index + 1].start < end) {
        next[index + 1].start = end;
      }

      return next;
    },
    [draftLyrics],
  );

  const handleLineTimeChange = (
    index: number,
    edge: TimelineEdge,
    value: string,
  ) => {
    const time = Number(value);
    if (!Number.isFinite(time)) return;
    setDraftLyrics((prev) =>
      edge === "start"
        ? resizeLineStart(index, time, prev)
        : resizeLineEnd(index, time, prev),
    );
  };

  const handleResizeMouseDown = (
    event: ReactMouseEvent<HTMLButtonElement>,
    index: number,
    edge: TimelineEdge,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = {
      index,
      edge,
      startX: event.clientX,
      lyrics: draftLyrics,
    };
  };

  const handleDragMove = useCallback(
    (clientX: number) => {
      const drag = dragRef.current;
      if (!drag) return;

      const deltaSeconds = (clientX - drag.startX) / pixelsPerSecond;
      const line = drag.lyrics[drag.index];
      if (!line) return;

      const nextTime =
        drag.edge === "start"
          ? line.start + deltaSeconds
          : line.end + deltaSeconds;
      setDraftLyrics(
        drag.edge === "start"
          ? resizeLineStart(drag.index, nextTime, drag.lyrics)
          : resizeLineEnd(drag.index, nextTime, drag.lyrics),
      );
    },
    [pixelsPerSecond, resizeLineEnd, resizeLineStart, setDraftLyrics],
  );

  const stopDragging = useCallback(() => {
    dragRef.current = null;
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!dragRef.current) return;
      event.preventDefault();
      handleDragMove(event.clientX);
    };

    const handleMouseUp = () => {
      stopDragging();
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleDragMove, stopDragging]);

  return {
    handleLineTimeChange,
    handleResizeMouseDown,
  };
};
