"use client";

import type { AdminRole } from "@appTypes/admin";
import type { LyricLine } from "@appTypes/lyric";
import type { Music } from "@appTypes/music";
import { useLyricPlayer } from "@components/common/YouTubeLyricsPlayer/useLyricPlayer";
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

import { getNormalizedLyrics } from "./LyricTimelineEditor/timelineUtils";
import { useTimelineResize } from "./LyricTimelineEditor/useTimelineResize";
import { useTimelineSelection } from "./LyricTimelineEditor/useTimelineSelection";
import { useTimelineShortcuts } from "./LyricTimelineEditor/useTimelineShortcuts";
import { useTimelineZoom } from "./LyricTimelineEditor/useTimelineZoom";
import styles from "./LyricTimelineEditor.module.css";
import {
  DEFAULT_PIXELS_PER_SECOND,
  MIN_LINE_DURATION,
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
  role: AdminRole;
}

export const LyricTimelineEditor = ({
  music,
  lyricTrack,
  role,
}: LyricTimelineEditorProps) => {
  const router = useRouter();
  const canManage = role === "admin";
  const timelineRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [draftLyrics, setDraftLyrics] = useState(() =>
    getNormalizedLyrics(lyricTrack.lyricJson),
  );
  const player = useLyricPlayer({
    youtubeId: music.youtubeId ?? "",
    lyrics: draftLyrics,
    sync: lyricTrack.sync,
    showReading: true,
  });
  const { currentTime, duration, activeLineIndex, offset: draftSync } = player;
  const [pixelsPerSecond, setPixelsPerSecond] = useState(
    DEFAULT_PIXELS_PER_SECOND,
  );
  const [selectedLineIndexes, setSelectedLineIndexes] = useState<number[]>([0]);
  const [editingLineIndex, setEditingLineIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);

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

  const updateLine = (index: number, patch: Partial<LyricLine>) => {
    if (!canManage) return;

    setDraftLyrics((prev) =>
      prev.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...patch } : line,
      ),
    );
  };

  const splitLine = (index: number) => {
    if (!canManage) return;

    const line = draftLyrics[index];
    if (!line) return;

    const splitTime = roundTime(currentTime - draftSync);
    const canSplit =
      splitTime > line.start + MIN_LINE_DURATION &&
      splitTime < line.end - MIN_LINE_DURATION;
    if (!canSplit) return;

    const nextLyrics = [
      ...draftLyrics.slice(0, index),
      { ...line, end: splitTime },
      { ...line, id: crypto.randomUUID(), start: splitTime },
      ...draftLyrics.slice(index + 1),
    ];
    setDraftLyrics(nextLyrics);
    setSelectedLineIndexes([index + 1]);
    setEditingLineIndex(index + 1);
  };

  const deleteLine = (index: number) => {
    if (!canManage) return;

    const nextLyrics = draftLyrics.filter(
      (_, lineIndex) => lineIndex !== index,
    );
    const nextIndex =
      nextLyrics.length === 0 ? null : Math.min(index, nextLyrics.length - 1);

    setDraftLyrics(nextLyrics);
    setSelectedLineIndexes(nextIndex == null ? [] : [nextIndex]);
    setEditingLineIndex(null);
  };

  const { handleLineTimeChange, handleResizeMouseDown } = useTimelineResize({
    draftLyrics,
    pixelsPerSecond,
    setDraftLyrics,
  });

  const {
    consumeLineClick,
    handleLineMouseDown,
    handleTrackMouseDown,
    selectionRect,
    selectLine,
  } = useTimelineSelection({
    canManage,
    draftLyrics,
    draftSync,
    pixelsPerSecond,
    selectedLineIndexes,
    setDraftLyrics,
    setSelectedLineIndexes,
    timelineStart,
    trackRef,
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
    pixelsPerSecond,
    player,
    onActiveLineSelect: selectLine,
    onZoom: zoomTimeline,
  });

  const handleSeekDisplayTime = (time: number) => {
    player.seekAndPause(time);
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

  const save = async () => {
    if (!canManage) return;

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

    const result = await response.json();
    setDraftLyrics(getNormalizedLyrics(result.lyricTrack.lyricJson));
    setMessage({ tone: "success", text: "저장했습니다." });
    router.refresh();
  };

  return (
    <div className={styles.editor}>
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
          player={player}
          dirty={dirty}
          canManage={canManage}
          isSaving={isSaving}
          message={message}
          onSave={save}
          onReset={() => {
            setDraftLyrics(getNormalizedLyrics(lyricTrack.lyricJson));
            player.resetOffset();
            setMessage(null);
          }}
          srtExport={{
            music,
            lyrics: canManage ? draftLyrics : lyricTrack.lyricJson,
          }}
        />

        <TimelineCanvas
          activeLineIndex={activeLineIndex}
          currentTime={currentTime}
          draftLyrics={draftLyrics}
          draftSync={draftSync}
          editingLineIndex={editingLineIndex}
          pixelsPerSecond={pixelsPerSecond}
          selectedLineIndexes={selectedLineIndexes}
          selectionRect={selectionRect}
          timelineEnd={timelineEnd}
          timelineRef={timelineRef}
          timelineStart={timelineStart}
          trackRef={trackRef}
          timelineWidth={timelineWidth}
          onConsumeLineClick={consumeLineClick}
          onDeleteLine={deleteLine}
          onEditLine={setEditingLineIndex}
          onLineTimeChange={handleLineTimeChange}
          onLineMouseDown={handleLineMouseDown}
          onResizeMouseDown={handleResizeMouseDown}
          onRulerClick={handleRulerClick}
          onSelectLine={selectLine}
          onSplitLine={splitLine}
          onTrackMouseDown={handleTrackMouseDown}
          onUpdateLine={updateLine}
          canManage={canManage}
          onWheel={handleWheel}
        />
      </div>
    </div>
  );
};
