"use client";

import type { LyricLine } from "@appTypes/lyric";
import { Popover } from "@radix-ui/themes";
import type { MouseEvent as ReactMouseEvent } from "react";
import styles from "../LyricTimelineEditor.module.css";
import { formatTime, getLineLabel } from "../time";
import { TimelineLinePopover } from "./TimelineLinePopover";
import type { TimelineEdge } from "./useTimelineResize";

interface TimelineLineBlockProps {
  displayStart: number;
  index: number;
  isActive: boolean;
  isEditing: boolean;
  isSelected: boolean;
  left: number;
  line: LyricLine;
  width: number;
  onEdit: (index: number | null) => void;
  onLineTimeChange: (index: number, edge: TimelineEdge, value: string) => void;
  onResizeMouseDown: (
    event: ReactMouseEvent<HTMLButtonElement>,
    index: number,
    edge: TimelineEdge,
  ) => void;
  onSelect: (index: number) => void;
  onUpdateLine: (index: number, patch: Partial<LyricLine>) => void;
}

export const TimelineLineBlock = ({
  displayStart,
  index,
  isActive,
  isEditing,
  isSelected,
  left,
  line,
  width,
  onEdit,
  onLineTimeChange,
  onResizeMouseDown,
  onSelect,
  onUpdateLine,
}: TimelineLineBlockProps) => (
  <Popover.Root
    open={isEditing}
    onOpenChange={(open) => {
      if (open) {
        onSelect(index);
        onEdit(index);
      } else if (isEditing) {
        onEdit(null);
      }
    }}
  >
    <Popover.Trigger>
      <div
        className={styles.block}
        data-active={isActive}
        data-selected={isSelected}
        style={{ left, width }}
        role="button"
        tabIndex={0}
        onClick={(event) => {
          event.preventDefault();

          if (isSelected) {
            onEdit(index);
            return;
          }

          onSelect(index);
          onEdit(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onSelect(index);
            onEdit(index);
          }
        }}
      >
        <button
          type="button"
          className={`${styles.handle} ${styles.handleStart}`}
          aria-label="start 조정"
          onMouseDown={(event) => onResizeMouseDown(event, index, "start")}
          onClick={(event) => event.stopPropagation()}
        />
        <div className={styles.blockText}>
          <span className={styles.blockMain}>{getLineLabel(line, index)}</span>
          <span className={styles.blockSub}>
            {line.kr || `${formatTime(displayStart)}`}
          </span>
        </div>
        <button
          type="button"
          className={`${styles.handle} ${styles.handleEnd}`}
          aria-label="end 조정"
          onMouseDown={(event) => onResizeMouseDown(event, index, "end")}
          onClick={(event) => event.stopPropagation()}
        />
      </div>
    </Popover.Trigger>
    <Popover.Content width="360px" sideOffset={8}>
      <TimelineLinePopover
        index={index}
        line={line}
        onLineTimeChange={onLineTimeChange}
        onUpdateLine={onUpdateLine}
      />
    </Popover.Content>
  </Popover.Root>
);
