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
  selectedLineIndex: number | null;
  timelineEnd: number;
  timelineRef: RefObject<HTMLDivElement | null>;
  timelineStart: number;
  timelineWidth: number;
  onEditLine: (index: number | null) => void;
  onLineTimeChange: (index: number, edge: TimelineEdge, value: string) => void;
  onResizeMouseDown: (
    event: ReactMouseEvent<HTMLButtonElement>,
    index: number,
    edge: TimelineEdge,
  ) => void;
  onRulerClick: (event: ReactMouseEvent<HTMLDivElement>) => void;
  onSelectLine: (index: number) => void;
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
  selectedLineIndex,
  timelineEnd,
  timelineRef,
  timelineStart,
  timelineWidth,
  onEditLine,
  onLineTimeChange,
  onResizeMouseDown,
  onRulerClick,
  onSelectLine,
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

          <div className={styles.track}>
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
                  displayStart={displayStart}
                  index={index}
                  canManage={canManage}
                  isActive={activeLineIndex === index}
                  isEditing={editingLineIndex === index}
                  isSelected={selectedLineIndex === index}
                  left={left}
                  line={line}
                  width={width}
                  onEdit={onEditLine}
                  onLineTimeChange={onLineTimeChange}
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
