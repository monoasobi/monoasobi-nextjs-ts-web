"use client";

import type { LyricLine } from "@appTypes/lyric";
import type { Music } from "@appTypes/music";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { Button, Callout, Flex, Text, TextField } from "@radix-ui/themes";
import type { RefObject } from "react";
import styles from "../LyricTimelineEditor.module.css";
import {
  TimelineYouTubePreview,
  type TimelineYouTubePreviewHandle,
} from "../TimelineYouTubePreview";
import { roundTime } from "../time";
import { SRT_EXPORTS, type SrtExportConfig } from "./srt";

interface TimelineSidePanelProps {
  music: Music;
  activeLine: LyricLine | null;
  previewRef: RefObject<TimelineYouTubePreviewHandle | null>;
  draftSync: number;
  dirty: boolean;
  isSaving: boolean;
  message: { tone: "success" | "error"; text: string } | null;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onSyncChange: (sync: number) => void;
  onSave: () => void;
  onReset: () => void;
  onExportSrt: (exportConfig: SrtExportConfig) => void;
}

export const TimelineSidePanel = ({
  music,
  activeLine,
  previewRef,
  draftSync,
  dirty,
  isSaving,
  message,
  onTimeUpdate,
  onDurationChange,
  onSyncChange,
  onSave,
  onReset,
  onExportSrt,
}: TimelineSidePanelProps) => (
  <aside className={styles.sidePanel}>
    <TimelineYouTubePreview
      ref={previewRef}
      youtubeId={music.youtubeId ?? ""}
      activeLine={activeLine}
      onTimeUpdate={onTimeUpdate}
      onDurationChange={onDurationChange}
    />

    <div className={styles.controlPanel}>
      <label className={styles.field}>
        <Text size="1" color="gray" weight="bold">
          sync
        </Text>
        <TextField.Root
          type="number"
          step="0.01"
          value={draftSync}
          onChange={(event) => {
            const value = Number(event.target.value);
            if (Number.isFinite(value)) onSyncChange(roundTime(value));
          }}
        />
      </label>
      <Flex gap="1" wrap="wrap">
        {[-0.1, -0.01, 0.01, 0.1].map((step) => (
          <Button
            key={step}
            type="button"
            size="1"
            variant="soft"
            color="gray"
            onClick={() => onSyncChange(roundTime(draftSync + step))}
          >
            {step > 0 ? "+" : ""}
            {step}
          </Button>
        ))}
      </Flex>
      <Flex align="center" gap="2" wrap="wrap">
        <Button type="button" size="1" disabled={!dirty || isSaving} onClick={onSave}>
          {isSaving ? "저장 중" : "저장"}
        </Button>
        <Button
          type="button"
          size="1"
          variant="soft"
          color="gray"
          onClick={onReset}
        >
          <ArrowPathIcon width="14" height="14" />
          되돌리기
        </Button>
      </Flex>

      <div className={styles.exportPanel}>
        <Text size="1" color="gray" weight="bold">
          SRT Export
        </Text>
        <Flex gap="1" wrap="wrap">
          {SRT_EXPORTS.map((exportConfig) => (
            <Button
              key={exportConfig.key}
              type="button"
              size="1"
              variant="soft"
              color="gray"
              onClick={() => onExportSrt(exportConfig)}
            >
              <ArrowDownTrayIcon width="14" height="14" />
              {exportConfig.label}
            </Button>
          ))}
        </Flex>
      </div>

      {message && (
        <Callout.Root
          color={message.tone === "error" ? "red" : "green"}
          variant="soft"
        >
          <Callout.Text>{message.text}</Callout.Text>
        </Callout.Root>
      )}
    </div>
  </aside>
);
