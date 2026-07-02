import type { LyricLine } from "@appTypes/lyric";

export const MIN_LINE_DURATION = 0.1;
export const DEFAULT_PIXELS_PER_SECOND = 72;
export const MIN_PIXELS_PER_SECOND = 20;
export const MAX_PIXELS_PER_SECOND = 300;

export const roundTime = (value: number) => Number(value.toFixed(2));

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const getDisplayStart = (line: LyricLine, sync: number) =>
  line.start + sync;

export const getDisplayEnd = (line: LyricLine, sync: number) =>
  line.end + sync;

export const getTimelineStart = (lyrics: LyricLine[], sync: number) => {
  const minDisplayStart = lyrics.reduce(
    (min, line) => Math.min(min, getDisplayStart(line, sync)),
    0,
  );

  return Math.min(0, Math.floor(minDisplayStart));
};

export const getTimelineEnd = (
  lyrics: LyricLine[],
  sync: number,
  duration: number,
) => {
  const maxDisplayEnd = lyrics.reduce(
    (max, line) => Math.max(max, getDisplayEnd(line, sync)),
    duration,
  );

  return Math.max(duration, Math.ceil(maxDisplayEnd));
};

export const getLineLabel = (line: LyricLine, index: number) =>
  line.jpReading || line.jp || line.kr || `Line ${index + 1}`;

export const formatTime = (seconds: number) => {
  const sign = seconds < 0 ? "-" : "";
  const abs = Math.abs(seconds);
  const minutes = Math.floor(abs / 60);
  const wholeSeconds = Math.floor(abs % 60);
  const fraction = Math.round((abs - Math.floor(abs)) * 100);

  return `${sign}${minutes}:${wholeSeconds
    .toString()
    .padStart(2, "0")}.${fraction.toString().padStart(2, "0")}`;
};
