"use client";

import type { LyricLine } from "@appTypes/lyric";
import type { Music } from "@appTypes/music";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import {
  Button,
  Callout,
  Flex,
  Popover,
  Select,
  Text,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type WheelEvent,
} from "react";
import styles from "./LyricTimelineEditor.module.css";
import {
  TimelineYouTubePreview,
  type TimelineYouTubePreviewHandle,
} from "./TimelineYouTubePreview";
import {
  DEFAULT_PIXELS_PER_SECOND,
  MAX_PIXELS_PER_SECOND,
  MIN_LINE_DURATION,
  MIN_PIXELS_PER_SECOND,
  clamp,
  formatTime,
  getDisplayEnd,
  getDisplayStart,
  getLineLabel,
  getTimelineEnd,
  getTimelineStart,
  roundTime,
} from "./time";

const ZOOM_FACTOR = 1.18;
const TICK_SECONDS = 5;
const NONE_CALL_TYPE = "NONE";

interface LyricTimelineEditorProps {
  music: Music;
  lyricTrack: {
    musicId: number;
    sync: number;
    lyricJson: LyricLine[];
  };
}

type DragState = {
  index: number;
  edge: "start" | "end";
  startX: number;
  lyrics: LyricLine[];
};

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest("input, textarea, select, button, [contenteditable='true']"),
  );
};

const getNormalizedLyrics = (lyrics: LyricLine[]) =>
  lyrics.map((line) => ({
    ...line,
    start: roundTime(line.start),
    end: roundTime(line.end),
  }));

export const LyricTimelineEditor = ({
  music,
  lyricTrack,
}: LyricTimelineEditorProps) => {
  const router = useRouter();
  const previewRef = useRef<TimelineYouTubePreviewHandle>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
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

  const timelineToPixel = (time: number) =>
    (time - timelineStart) * pixelsPerSecond;

  const updateLine = (index: number, patch: Partial<LyricLine>) => {
    setDraftLyrics((prev) =>
      prev.map((line, lineIndex) =>
        lineIndex === index ? { ...line, ...patch } : line,
      ),
    );
  };

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
    edge: "start" | "end",
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

  const handleMouseDown = (
    event: ReactMouseEvent<HTMLButtonElement>,
    index: number,
    edge: "start" | "end",
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
    [pixelsPerSecond, resizeLineEnd, resizeLineStart],
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

  const getAnchorTime = useCallback(
    (clientX?: number) => {
      const timeline = timelineRef.current;
      if (!timeline) return currentTime || 0;

      const rect = timeline.getBoundingClientRect();
      const x = clientX == null ? rect.width / 2 : clientX - rect.left;
      return timelineStart + (timeline.scrollLeft + x) / pixelsPerSecond;
    },
    [currentTime, pixelsPerSecond, timelineStart],
  );

  const zoomTimeline = useCallback(
    (nextPixels: number, anchorTime = getAnchorTime()) => {
      const timeline = timelineRef.current;
      const nextPixelsPerSecond = clamp(
        nextPixels,
        MIN_PIXELS_PER_SECOND,
        MAX_PIXELS_PER_SECOND,
      );

      if (!timeline) {
        setPixelsPerSecond(nextPixelsPerSecond);
        return;
      }

      const rect = timeline.getBoundingClientRect();
      const anchorX =
        anchorTime === currentTime
          ? rect.width / 2
          : (anchorTime - timelineStart) * pixelsPerSecond -
            timeline.scrollLeft;

      setPixelsPerSecond(nextPixelsPerSecond);

      requestAnimationFrame(() => {
        timeline.scrollLeft =
          (anchorTime - timelineStart) * nextPixelsPerSecond - anchorX;
      });
    },
    [currentTime, getAnchorTime, pixelsPerSecond, timelineStart],
  );

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!event.metaKey) return;
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    const factor = Math.pow(ZOOM_FACTOR, direction);
    zoomTimeline(pixelsPerSecond * factor, getAnchorTime(event.clientX));
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isTimelineHot || isEditableTarget(event.target)) return;

      if (event.code === "Space") {
        event.preventDefault();
        previewRef.current?.togglePlay();
      }

      if (event.code === "Enter" && activeLineIndex >= 0) {
        event.preventDefault();
        setSelectedLineIndex(activeLineIndex);
      }

      if (event.metaKey && (event.key === "=" || event.key === "+")) {
        event.preventDefault();
        zoomTimeline(pixelsPerSecond * ZOOM_FACTOR);
      }

      if (event.metaKey && event.key === "-") {
        event.preventDefault();
        zoomTimeline(pixelsPerSecond / ZOOM_FACTOR);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeLineIndex, isTimelineHot, pixelsPerSecond, zoomTimeline]);

  const handleSeekDisplayTime = (time: number) => {
    const seekTime = Math.max(0, time);
    setCurrentTime(seekTime);
    previewRef.current?.seekAndPlay(seekTime);
  };

  const handleRulerClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const scrollLeft = timelineRef.current?.scrollLeft ?? 0;
    const time =
      timelineStart +
      (scrollLeft + event.clientX - rect.left) / pixelsPerSecond;
    handleSeekDisplayTime(time);
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

  const ticks = [];
  for (
    let time = Math.ceil(timelineStart / TICK_SECONDS) * TICK_SECONDS;
    time <= timelineEnd;
    time += TICK_SECONDS
  ) {
    ticks.push(time);
  }

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
        <aside className={styles.sidePanel}>
          <TimelineYouTubePreview
            ref={previewRef}
            youtubeId={music.youtubeId ?? ""}
            onTimeUpdate={setCurrentTime}
            onDurationChange={setDuration}
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
                  if (Number.isFinite(value)) setDraftSync(roundTime(value));
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
                  onClick={() => setDraftSync((prev) => roundTime(prev + step))}
                >
                  {step > 0 ? "+" : ""}
                  {step}
                </Button>
              ))}
            </Flex>
            <Flex align="center" gap="2" wrap="wrap">
              <Button
                type="button"
                size="1"
                disabled={!dirty || isSaving}
                onClick={save}
              >
                {isSaving ? "저장 중" : "저장"}
              </Button>
              <Button
                type="button"
                size="1"
                variant="soft"
                color="gray"
                onClick={() => {
                  setDraftLyrics(getNormalizedLyrics(lyricTrack.lyricJson));
                  setDraftSync(lyricTrack.sync);
                  setMessage(null);
                }}
              >
                <ArrowPathIcon width="14" height="14" />
                되돌리기
              </Button>
            </Flex>

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

        <section className={styles.timelineSection}>
          <div
            className={styles.timelineScroll}
            ref={timelineRef}
            onWheel={handleWheel}
          >
            <div
              className={styles.timelineCanvas}
              style={{ width: timelineWidth }}
            >
              <div className={styles.ruler} onClick={handleRulerClick}>
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
                  const isActive = activeLineIndex === index;
                  const isSelected = selectedLineIndex === index;

                  return (
                    <Popover.Root
                      key={`${line.start}-${line.end}-${index}`}
                      open={isSelected}
                      onOpenChange={(open) =>
                        setSelectedLineIndex(open ? index : null)
                      }
                    >
                      <Popover.Trigger>
                        <div
                          className={styles.block}
                          data-active={isActive}
                          data-selected={isSelected}
                          style={{ left, width }}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setSelectedLineIndex(index);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              setSelectedLineIndex(index);
                            }
                          }}
                        >
                          <button
                            type="button"
                            className={`${styles.handle} ${styles.handleStart}`}
                            aria-label="start 조정"
                            onMouseDown={(event) =>
                              handleMouseDown(event, index, "start")
                            }
                          />
                          <div className={styles.blockText}>
                            <span className={styles.blockMain}>
                              {getLineLabel(line, index)}
                            </span>
                            <span className={styles.blockSub}>
                              {line.kr || `${formatTime(displayStart)}`}
                            </span>
                          </div>
                          <button
                            type="button"
                            className={`${styles.handle} ${styles.handleEnd}`}
                            aria-label="end 조정"
                            onMouseDown={(event) =>
                              handleMouseDown(event, index, "end")
                            }
                          />
                        </div>
                      </Popover.Trigger>
                      <Popover.Content width="360px" sideOffset={8}>
                        <Flex direction="column" gap="3">
                          <Text size="2" weight="bold">
                            Line {index + 1}
                          </Text>
                          <Flex gap="2">
                            <label className={styles.popoverField}>
                              <Text size="1" color="gray">
                                start
                              </Text>
                              <TextField.Root
                                type="number"
                                step="0.01"
                                value={line.start}
                                onChange={(event) =>
                                  handleLineTimeChange(
                                    index,
                                    "start",
                                    event.target.value,
                                  )
                                }
                              />
                            </label>
                            <label className={styles.popoverField}>
                              <Text size="1" color="gray">
                                end
                              </Text>
                              <TextField.Root
                                type="number"
                                step="0.01"
                                value={line.end}
                                onChange={(event) =>
                                  handleLineTimeChange(
                                    index,
                                    "end",
                                    event.target.value,
                                  )
                                }
                              />
                            </label>
                          </Flex>
                          <label className={styles.popoverField}>
                            <Text size="1" color="gray">
                              jp
                            </Text>
                            <TextArea
                              value={line.jp}
                              onChange={(event) =>
                                updateLine(index, { jp: event.target.value })
                              }
                            />
                          </label>
                          <label className={styles.popoverField}>
                            <Text size="1" color="gray">
                              jpReading
                            </Text>
                            <TextArea
                              value={line.jpReading}
                              onChange={(event) =>
                                updateLine(index, {
                                  jpReading: event.target.value,
                                })
                              }
                            />
                          </label>
                          <label className={styles.popoverField}>
                            <Text size="1" color="gray">
                              kr
                            </Text>
                            <TextArea
                              value={line.kr}
                              onChange={(event) =>
                                updateLine(index, { kr: event.target.value })
                              }
                            />
                          </label>
                          <Flex gap="2">
                            <label className={styles.popoverField}>
                              <Text size="1" color="gray">
                                callType
                              </Text>
                              <Select.Root
                                value={line.callType ?? NONE_CALL_TYPE}
                                onValueChange={(value) =>
                                  updateLine(index, {
                                    callType:
                                      value === NONE_CALL_TYPE
                                        ? undefined
                                        : (value as LyricLine["callType"]),
                                  })
                                }
                              >
                                <Select.Trigger />
                                <Select.Content>
                                  <Select.Item value={NONE_CALL_TYPE}>
                                    없음
                                  </Select.Item>
                                  <Select.Item value="LOUD">LOUD</Select.Item>
                                  <Select.Item value="CLAP">CLAP</Select.Item>
                                  <Select.Item value="CUSTOM">
                                    CUSTOM
                                  </Select.Item>
                                </Select.Content>
                              </Select.Root>
                            </label>
                            <label className={styles.popoverField}>
                              <Text size="1" color="gray">
                                callGuide
                              </Text>
                              <TextField.Root
                                value={line.callGuide ?? ""}
                                onChange={(event) =>
                                  updateLine(index, {
                                    callGuide: event.target.value || undefined,
                                  })
                                }
                              />
                            </label>
                          </Flex>
                        </Flex>
                      </Popover.Content>
                    </Popover.Root>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
