"use client";

import type { LyricLine } from "@appTypes/lyric";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
  type SetStateAction,
} from "react";
import {
  clamp,
  getDisplayEnd,
  getDisplayStart,
  roundTime,
} from "../time";

const BLOCK_TOP = 64;
const BLOCK_HEIGHT = 84;
const DRAG_THRESHOLD = 3;

type SelectionBox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type SelectionRect = SelectionBox | null;

type AreaSelectionState = {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
};

type MoveSelectionState = {
  index: number;
  indexes: number[];
  lyrics: LyricLine[];
  moved: boolean;
  startX: number;
};

interface UseTimelineSelectionParams {
  canManage: boolean;
  draftLyrics: LyricLine[];
  draftSync: number;
  pixelsPerSecond: number;
  selectedLineIndexes: number[];
  setDraftLyrics: Dispatch<SetStateAction<LyricLine[]>>;
  setSelectedLineIndexes: Dispatch<SetStateAction<number[]>>;
  timelineStart: number;
  trackRef: RefObject<HTMLDivElement | null>;
}

const getRect = (selection: AreaSelectionState): SelectionBox => ({
  left: Math.min(selection.startX, selection.currentX),
  top: Math.min(selection.startY, selection.currentY),
  width: Math.abs(selection.currentX - selection.startX),
  height: Math.abs(selection.currentY - selection.startY),
});

const overlaps = (
  a: { left: number; top: number; right: number; bottom: number },
  b: { left: number; top: number; right: number; bottom: number },
) =>
  a.left <= b.right &&
  a.right >= b.left &&
  a.top <= b.bottom &&
  a.bottom >= b.top;

const isSameIndexes = (a: number[], b: number[]) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

export const useTimelineSelection = ({
  canManage,
  draftLyrics,
  draftSync,
  pixelsPerSecond,
  selectedLineIndexes,
  setDraftLyrics,
  setSelectedLineIndexes,
  timelineStart,
  trackRef,
}: UseTimelineSelectionParams) => {
  const areaSelectionRef = useRef<AreaSelectionState | null>(null);
  const moveSelectionRef = useRef<MoveSelectionState | null>(null);
  const suppressClickRef = useRef<number | null>(null);
  const [selectionRect, setSelectionRect] = useState<SelectionRect>(null);

  const getTrackPoint = useCallback(
    (event: MouseEvent | ReactMouseEvent<HTMLElement>) => {
      const track = trackRef.current;
      if (!track) return null;

      const rect = track.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    },
    [trackRef],
  );

  const selectIndexes = useCallback(
    (indexes: number[]) => {
      const nextIndexes = [...indexes].sort((a, b) => a - b);
      setSelectedLineIndexes(nextIndexes);
    },
    [setSelectedLineIndexes],
  );

  const selectLine = useCallback(
    (index: number) => {
      selectIndexes([index]);
    },
    [selectIndexes],
  );

  const handleTrackMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!canManage) return;
    if (event.button !== 0 || event.target !== event.currentTarget) return;

    const point = getTrackPoint(event);
    if (!point) return;

    event.preventDefault();
    areaSelectionRef.current = {
      startX: point.x,
      startY: point.y,
      currentX: point.x,
      currentY: point.y,
    };
    setSelectionRect({
      left: point.x,
      top: point.y,
      width: 0,
      height: 0,
    });
    selectIndexes([]);
  };

  const handleLineMouseDown = (
    event: ReactMouseEvent<HTMLDivElement>,
    index: number,
  ) => {
    if (!canManage) return;
    if (event.button !== 0) return;

    event.stopPropagation();

    const indexes = selectedLineIndexes.includes(index)
      ? selectedLineIndexes
      : [index];

    if (!selectedLineIndexes.includes(index)) {
      selectLine(index);
    }

    moveSelectionRef.current = {
      index,
      indexes,
      lyrics: draftLyrics,
      moved: false,
      startX: event.clientX,
    };
  };

  const consumeLineClick = (index: number) => {
    if (suppressClickRef.current !== index) return false;

    suppressClickRef.current = null;
    return true;
  };

  const updateAreaSelection = useCallback(
    (event: MouseEvent) => {
      const selection = areaSelectionRef.current;
      if (!selection) return;

      const point = getTrackPoint(event);
      if (!point) return;

      selection.currentX = point.x;
      selection.currentY = point.y;

      const rect = getRect(selection);
      setSelectionRect(rect);

      const selectionBox = {
        left: rect.left,
        top: rect.top,
        right: rect.left + rect.width,
        bottom: rect.top + rect.height,
      };
      const nextIndexes = draftLyrics.reduce<number[]>((indexes, line, index) => {
        const displayStart = getDisplayStart(line, draftSync);
        const displayEnd = getDisplayEnd(line, draftSync);
        const left = (displayStart - timelineStart) * pixelsPerSecond;
        const right = (displayEnd - timelineStart) * pixelsPerSecond;
        const blockBox = {
          left,
          top: BLOCK_TOP,
          right,
          bottom: BLOCK_TOP + BLOCK_HEIGHT,
        };

        if (overlaps(selectionBox, blockBox)) {
          indexes.push(index);
        }

        return indexes;
      }, []);

      if (!isSameIndexes(nextIndexes, selectedLineIndexes)) {
        selectIndexes(nextIndexes);
      }
    },
    [
      draftLyrics,
      draftSync,
      getTrackPoint,
      pixelsPerSecond,
      selectIndexes,
      selectedLineIndexes,
      timelineStart,
    ],
  );

  const updateMoveSelection = useCallback(
    (event: MouseEvent) => {
      const move = moveSelectionRef.current;
      if (!move) return;

      const deltaX = event.clientX - move.startX;
      if (Math.abs(deltaX) < DRAG_THRESHOLD && !move.moved) return;

      event.preventDefault();
      move.moved = true;

      const selectedIndexes = new Set(move.indexes);
      const minDelta = move.indexes.reduce((min, index) => {
        const line = move.lyrics[index];
        if (!line) return min;

        const previousLine = move.lyrics[index - 1];
        const previousLimit =
          previousLine && !selectedIndexes.has(index - 1)
            ? previousLine.end
            : 0;

        return Math.max(min, previousLimit - line.start);
      }, Number.NEGATIVE_INFINITY);
      const maxDelta = move.indexes.reduce((max, index) => {
        const line = move.lyrics[index];
        if (!line) return max;

        const nextLine = move.lyrics[index + 1];
        if (!nextLine || selectedIndexes.has(index + 1)) return max;

        return Math.min(max, nextLine.start - line.end);
      }, Number.POSITIVE_INFINITY);
      const deltaSeconds = roundTime(
        clamp(deltaX / pixelsPerSecond, minDelta, maxDelta),
      );

      setDraftLyrics(
        move.lyrics.map((line, index) =>
          selectedIndexes.has(index)
            ? {
                ...line,
                start: roundTime(line.start + deltaSeconds),
                end: roundTime(line.end + deltaSeconds),
              }
            : line,
        ),
      );
    },
    [pixelsPerSecond, setDraftLyrics],
  );

  const stopDragging = useCallback(() => {
    const move = moveSelectionRef.current;
    if (move?.moved) {
      suppressClickRef.current = move.index;
    }

    areaSelectionRef.current = null;
    moveSelectionRef.current = null;
    setSelectionRect(null);
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      updateAreaSelection(event);
      updateMoveSelection(event);
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
  }, [stopDragging, updateAreaSelection, updateMoveSelection]);

  return {
    consumeLineClick,
    handleLineMouseDown,
    handleTrackMouseDown,
    selectionRect,
    selectLine,
  };
};
