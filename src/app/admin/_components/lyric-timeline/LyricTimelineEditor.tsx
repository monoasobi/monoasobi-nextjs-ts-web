"use client";

import type { LyricLine } from "@appTypes/lyric";
import type { Music } from "@appTypes/music";
import { Callout } from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import {
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { TimelineCanvas } from "./LyricTimelineEditor/TimelineCanvas";
import { TimelineSidePanel } from "./LyricTimelineEditor/TimelineSidePanel";
import {
  buildSrt,
  downloadTextFile,
  sanitizeFilePart,
  type SrtExportConfig,
} from "./LyricTimelineEditor/srt";
import {
  getNormalizedLyrics,
} from "./LyricTimelineEditor/timelineUtils";
import { useTimelineResize } from "./LyricTimelineEditor/useTimelineResize";
import { useTimelineShortcuts } from "./LyricTimelineEditor/useTimelineShortcuts";
import { useTimelineZoom } from "./LyricTimelineEditor/useTimelineZoom";
import styles from "./LyricTimelineEditor.module.css";
import {
  type TimelineYouTubePreviewHandle,
} from "./TimelineYouTubePreview";
import {
  DEFAULT_PIXELS_PER_SECOND,
  getDisplayEnd,
  getDisplayStart,
  getTimelineEnd,
  getTimelineStart,
  roundTime,
} from "./time";

interface LyricTimelineEditorProps {
  music: Music;
  lyricTrack: {
    musicId: number;
    sync: number;
    lyricJson: LyricLine[];
  };
}

export const LyricTimelineEditor = ({
  music,
  lyricTrack,
}: LyricTimelineEditorProps) => {
  const router = useRouter();
  const previewRef = useRef<TimelineYouTubePreviewHandle>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [draftLyrics, setDraftLyrics] = useState(() =>
    getNormalizedLyrics(lyricTrack.lyricJson),
  );
  const [draftSync, setDraftSync] = useState(lyricTrack.sync);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [pixelsPerSecond, setPixelsPerSecond] = useState(
    DEFAULT_PIXELS_PER_SECOND,
  );
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(0);
  const [editingLineIndex, setEditingLineIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [isTimelineHot, setIsTimelineHot] = useState(false);

  const timelineStart = useMemo(
    () => getTimelineStart(draftLyrics, draftSync),
    [draftLyrics, draftSync],
  );
  const timelineEnd = useMemo(
    () => getTimelineEnd(draftLyrics, draftSync, duration),
    [draftLyrics, draftSync, duration],
  );
  const timelineWidth = Math.max(
    960,
    (timelineEnd - timelineStart) * pixelsPerSecond,
  );
  const dirty =
    draftSync !== lyricTrack.sync ||
    JSON.stringify(draftLyrics) !==
      JSON.stringify(getNormalizedLyrics(lyricTrack.lyricJson));

  const activeLineIndex = useMemo(
    () =>
      draftLyrics.findIndex(
        (line) =>
          currentTime >= getDisplayStart(line, draftSync) &&
          currentTime < getDisplayEnd(line, draftSync),
      ),
    [currentTime, draftLyrics, draftSync],
  );
  const activeLine =
    activeLineIndex >= 0 ? (draftLyrics[activeLineIndex] ?? null) : null;

  const updateLine = (index: number, patch: Partial<LyricLine>) => {
    setDraftLyrics((prev) =>
      prev.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...patch } : line,
      ),
    );
  };

  const { handleLineTimeChange, handleResizeMouseDown } = useTimelineResize({
    draftLyrics,
    pixelsPerSecond,
    setDraftLyrics,
  });

  const { handleWheel, zoomTimeline } = useTimelineZoom({
    currentTime,
    pixelsPerSecond,
    setPixelsPerSecond,
    timelineRef,
    timelineStart,
  });

  useTimelineShortcuts({
    activeLineIndex,
    isTimelineHot,
    pixelsPerSecond,
    previewRef,
    onActiveLineSelect: setSelectedLineIndex,
    onZoom: zoomTimeline,
  });

  const handleSeekDisplayTime = (time: number) => {
    const seekTime = Math.max(0, time);
    setCurrentTime(seekTime);
    previewRef.current?.seekAndPause(seekTime);
  };

  const handleRulerClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    const rect = timeline.getBoundingClientRect();
    const time =
      timelineStart +
      (timeline.scrollLeft + event.clientX - rect.left) / pixelsPerSecond;
    handleSeekDisplayTime(time);
  };

  const exportSrt = (exportConfig: SrtExportConfig) => {
    const normalizedLyrics = getNormalizedLyrics(draftLyrics);
    const srt = buildSrt(normalizedLyrics, exportConfig.key);
    const filenameBase = `${music.id}_${sanitizeFilePart(music.korTitle || music.title)}`;

    downloadTextFile(`${filenameBase} ${exportConfig.suffix}.srt`, srt);
  };

  const save = async () => {
    setIsSaving(true);
    setMessage(null);

    const payload = {
      musicId: lyricTrack.musicId,
      sync: roundTime(draftSync),
      lyricJson: getNormalizedLyrics(draftLyrics),
    };

    const response = await fetch(
      `/api/admin/lyric-tracks/${lyricTrack.musicId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    setIsSaving(false);

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      setMessage({
        tone: "error",
        text: error?.error ?? "저장에 실패했습니다.",
      });
      return;
    }

    setMessage({ tone: "success", text: "저장했습니다." });
    router.refresh();
  };

  return (
    <div
      className={styles.editor}
      onMouseEnter={() => setIsTimelineHot(true)}
      onMouseLeave={() => setIsTimelineHot(false)}
    >
      <div className={styles.smallScreenNotice}>
        <Callout.Root color="amber" variant="soft">
          <Callout.Text>
            타임라인 편집은 넓은 화면에서만 사용할 수 있습니다. 브라우저 폭을
            넓힌 뒤 다시 시도해주세요.
          </Callout.Text>
        </Callout.Root>
      </div>

      <div className={styles.workspace}>
        <TimelineSidePanel
          music={music}
          activeLine={activeLine}
          previewRef={previewRef}
          draftSync={draftSync}
          dirty={dirty}
          isSaving={isSaving}
          message={message}
          onTimeUpdate={setCurrentTime}
          onDurationChange={setDuration}
          onSyncChange={setDraftSync}
          onSave={save}
          onReset={() => {
            setDraftLyrics(getNormalizedLyrics(lyricTrack.lyricJson));
            setDraftSync(lyricTrack.sync);
            setMessage(null);
          }}
          onExportSrt={exportSrt}
        />

        <TimelineCanvas
          activeLineIndex={activeLineIndex}
          currentTime={currentTime}
          draftLyrics={draftLyrics}
          draftSync={draftSync}
          editingLineIndex={editingLineIndex}
          pixelsPerSecond={pixelsPerSecond}
          selectedLineIndex={selectedLineIndex}
          timelineEnd={timelineEnd}
          timelineRef={timelineRef}
          timelineStart={timelineStart}
          timelineWidth={timelineWidth}
          onEditLine={setEditingLineIndex}
          onLineTimeChange={handleLineTimeChange}
          onResizeMouseDown={handleResizeMouseDown}
          onRulerClick={handleRulerClick}
          onSelectLine={setSelectedLineIndex}
          onUpdateLine={updateLine}
          onWheel={handleWheel}
        />
      </div>
    </div>
  );
};
