import type { LyricLine } from "@appTypes/lyric";
import {
  roundTime,
  getDisplayStart,
  getDisplayEnd,
  formatTime as formatPlayerTime,
} from "@components/common/YouTubeLyricsPlayer/time";

export const MIN_LINE_DURATION = 0.1;
export const DEFAULT_PIXELS_PER_SECOND = 72;
export const MIN_PIXELS_PER_SECOND = 20;
export const MAX_PIXELS_PER_SECOND = 300;

export { roundTime, getDisplayStart, getDisplayEnd };

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

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

export const formatTime = (seconds: number) => formatPlayerTime(seconds, true);
