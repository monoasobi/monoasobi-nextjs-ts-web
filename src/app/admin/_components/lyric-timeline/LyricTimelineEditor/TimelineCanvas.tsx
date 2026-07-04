"use client";

import type { LyricLine } from "@appTypes/lyric";
import type { MouseEvent as ReactMouseEvent, RefObject } from "react";
import styles from "../LyricTimelineEditor.module.css";
import {
  formatTime,
  getDisplayEnd,
  getDisplayStart,
} from "../time";
import { getTimelineTicks } from "./timelineUtils";
import { TimelineLineBlock } from "./TimelineLineBlock";
import type { TimelineEdge } from "./useTimelineResize";

interface TimelineCanvasProps {
  activeLineIndex: number;
  canManage: boolean;
  currentTime: number;
  draftLyrics: LyricLine[];
  draftSync: number;
  editingLineIndex: number | null;
  pixelsPerSecond: number;
  selectedLineIndexes: number[];
  selectionRect: {
    left: number;
    top: number;
    width: number;
    height: number;
  } | null;
  timelineEnd: number;
  timelineRef: RefObject<HTMLDivElement | null>;
  timelineStart: number;
  trackRef: RefObject<HTMLDivElement | null>;
  timelineWidth: number;
  onConsumeLineClick: (index: number) => boolean;
  onEditLine: (index: number | null) => void;
  onLineTimeChange: (index: number, edge: TimelineEdge, value: string) => void;
  onLineMouseDown: (
    event: ReactMouseEvent<HTMLDivElement>,
    index: number,
  ) => void;
  onResizeMouseDown: (
    event: ReactMouseEvent<HTMLButtonElement>,
    index: number,
    edge: TimelineEdge,
  ) => void;
  onRulerClick: (event: ReactMouseEvent<HTMLDivElement>) => void;
  onSelectLine: (index: number) => void;
  onTrackMouseDown: (event: ReactMouseEvent<HTMLDivElement>) => void;
  onUpdateLine: (index: number, patch: Partial<LyricLine>) => void;
  onWheel: (event: React.WheelEvent<HTMLDivElement>) => void;
}

export const TimelineCanvas = ({
  activeLineIndex,
  canManage,
  currentTime,
  draftLyrics,
  draftSync,
  editingLineIndex,
  pixelsPerSecond,
  selectedLineIndexes,
  selectionRect,
  timelineEnd,
  timelineRef,
  timelineStart,
  trackRef,
  timelineWidth,
  onConsumeLineClick,
  onEditLine,
  onLineTimeChange,
  onLineMouseDown,
  onResizeMouseDown,
  onRulerClick,
  onSelectLine,
  onTrackMouseDown,
  onUpdateLine,
  onWheel,
}: TimelineCanvasProps) => {
  const timelineToPixel = (time: number) =>
    (time - timelineStart) * pixelsPerSecond;
  const ticks = getTimelineTicks(timelineStart, timelineEnd);

  return (
    <section className={styles.timelineSection}>
      <div className={styles.timelineScroll} ref={timelineRef} onWheel={onWheel}>
        <div className={styles.timelineCanvas} style={{ width: timelineWidth }}>
          <div className={styles.ruler} onClick={onRulerClick}>
            {ticks.map((time) => (
              <div
                key={time}
                className={styles.tick}
                style={{ left: timelineToPixel(time) }}
              >
                {formatTime(time)}
              </div>
            ))}
          </div>

          <div
            className={styles.playhead}
            style={{ left: timelineToPixel(currentTime) }}
            aria-label={`현재 시간 ${formatTime(currentTime)}`}
          />

          <div
            className={styles.track}
            data-can-manage={canManage}
            ref={trackRef}
            onMouseDown={onTrackMouseDown}
          >
            {selectionRect && (
              <div
                className={styles.selectionRect}
                style={selectionRect}
                aria-hidden="true"
              />
            )}
            {draftLyrics.map((line, index) => {
              const displayStart = getDisplayStart(line, draftSync);
              const displayEnd = getDisplayEnd(line, draftSync);
              const left = timelineToPixel(displayStart);
              const width = Math.max(
                24,
                (displayEnd - displayStart) * pixelsPerSecond,
              );

              return (
                <TimelineLineBlock
                  key={`${line.start}-${line.end}-${index}`}
                  index={index}
                  canManage={canManage}
                  isActive={activeLineIndex === index}
                  isEditing={editingLineIndex === index}
                  isSelected={selectedLineIndexes.includes(index)}
                  left={left}
                  line={line}
                  width={width}
                  onConsumeClick={onConsumeLineClick}
                  onEdit={onEditLine}
                  onLineTimeChange={onLineTimeChange}
                  onMouseDown={onLineMouseDown}
                  onResizeMouseDown={onResizeMouseDown}
                  onSelect={onSelectLine}
                  onUpdateLine={onUpdateLine}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
