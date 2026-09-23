"use client";

import type { LyricPlayer } from "@components/common/YouTubeLyricsPlayer/useLyricPlayer";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Button, Callout, Flex, Text, TextField } from "@radix-ui/themes";
import styles from "../LyricTimelineEditor.module.css";
import { TimelineYouTubePreview } from "../TimelineYouTubePreview";
import { AdminSrtExport, type AdminSrtExportProps } from "../../AdminSrtExport";

interface TimelineSidePanelProps {
  player: LyricPlayer;
  dirty: boolean;
  canManage: boolean;
  isSaving: boolean;
  message: { tone: "success" | "error"; text: string } | null;
  onSave: () => void;
  onReset: () => void;
  srtExport: AdminSrtExportProps;
}

export const TimelineSidePanel = ({
  player,
  dirty,
  canManage,
  isSaving,
  message,
  onSave,
  onReset,
  srtExport,
}: TimelineSidePanelProps) => (
  <aside className={styles.sidePanel}>
    <TimelineYouTubePreview player={player} />

    <div className={styles.controlPanel}>
      <label className={styles.field}>
        <Text size="1" color="gray" weight="bold">
          sync
        </Text>
        <TextField.Root
          type="number"
          step="0.01"
          value={player.offset}
          disabled={!canManage}
          onChange={(event) => {
            if (!canManage) return;

            const value = Number(event.target.value);
            if (Number.isFinite(value)) player.setOffset(value);
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
            disabled={!canManage}
            onClick={() => player.adjustOffset(step)}
          >
            {step > 0 ? "+" : ""}
            {step}
          </Button>
        ))}
      </Flex>
      {canManage && (
        <Flex align="center" gap="2" wrap="wrap">
          <Button
            type="button"
            size="1"
            disabled={!dirty || isSaving}
            onClick={onSave}
          >
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
      )}

      <div className={styles.exportPanel}>
        <AdminSrtExport {...srtExport} />
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
