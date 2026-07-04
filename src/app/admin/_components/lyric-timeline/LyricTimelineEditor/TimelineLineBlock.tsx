"use client";

import type { LyricLine } from "@appTypes/lyric";
import { Popover } from "@radix-ui/themes";
import type { MouseEvent as ReactMouseEvent } from "react";
import styles from "../LyricTimelineEditor.module.css";
import { TimelineLinePopover } from "./TimelineLinePopover";
import type { TimelineEdge } from "./useTimelineResize";

interface TimelineLineBlockProps {
  canManage: boolean;
  currentTime: number;
  draftSync: number;
  index: number;
  isActive: boolean;
  isEditing: boolean;
  isSelected: boolean;
  left: number;
  line: LyricLine;
  width: number;
  onConsumeClick: (index: number) => boolean;
  onDelete: (index: number) => void;
  onEdit: (index: number | null) => void;
  onLineTimeChange: (index: number, edge: TimelineEdge, value: string) => void;
  onMouseDown: (
    event: ReactMouseEvent<HTMLDivElement>,
    index: number,
  ) => void;
  onResizeMouseDown: (
    event: ReactMouseEvent<HTMLButtonElement>,
    index: number,
    edge: TimelineEdge,
  ) => void;
  onSelect: (index: number) => void;
  onSplit: (index: number) => void;
  onUpdateLine: (index: number, patch: Partial<LyricLine>) => void;
}

export const TimelineLineBlock = ({
  canManage,
  currentTime,
  draftSync,
  index,
  isActive,
  isEditing,
  isSelected,
  left,
  line,
  width,
  onConsumeClick,
  onDelete,
  onEdit,
  onLineTimeChange,
  onMouseDown,
  onResizeMouseDown,
  onSelect,
  onSplit,
  onUpdateLine,
}: TimelineLineBlockProps) => {
  const jpText = line.jp || `Line ${index + 1}`;
  const readingText = line.jpReading || " ";
  const krText = line.kr || " ";

  return (
    <Popover.Root
      open={canManage && isEditing}
      onOpenChange={(open) => {
        if (!canManage) return;

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
          data-can-manage={canManage}
          data-selected={isSelected}
          style={{ left, width }}
          role="button"
          tabIndex={0}
          onMouseDown={(event) => {
            if (canManage) onMouseDown(event, index);
          }}
          onClick={(event) => {
            event.preventDefault();

            if (onConsumeClick(index)) return;

            if (isSelected) {
              if (canManage) onEdit(index);
              return;
            }

            onSelect(index);
            onEdit(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSelect(index);
              if (canManage) onEdit(index);
            }
          }}
        >
          {canManage && (
            <button
              type="button"
              className={`${styles.handle} ${styles.handleStart}`}
              aria-label="start 조정"
              onMouseDown={(event) => onResizeMouseDown(event, index, "start")}
              onClick={(event) => event.stopPropagation()}
            />
          )}
          <div className={styles.blockText}>
            <span className={styles.blockMain}>{jpText}</span>
            <span className={styles.blockReading}>{readingText}</span>
            <span className={styles.blockSub}>{krText}</span>
          </div>
          {canManage && (
            <button
              type="button"
              className={`${styles.handle} ${styles.handleEnd}`}
              aria-label="end 조정"
              onMouseDown={(event) => onResizeMouseDown(event, index, "end")}
              onClick={(event) => event.stopPropagation()}
            />
          )}
        </div>
      </Popover.Trigger>
      {canManage && (
        <Popover.Content width="360px" sideOffset={8}>
          <TimelineLinePopover
            currentTime={currentTime}
            draftSync={draftSync}
            index={index}
            line={line}
            onDelete={onDelete}
            onLineTimeChange={onLineTimeChange}
            onSplit={onSplit}
            onUpdateLine={onUpdateLine}
          />
        </Popover.Content>
      )}
    </Popover.Root>
  );
};
