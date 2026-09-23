import type { LyricLine } from "@appTypes/lyric";

export const roundTime = (value: number) => Number(value.toFixed(2));
export const getDisplayStart = (line: LyricLine, offset: number) =>
  line.start + offset;
export const getDisplayEnd = (line: LyricLine, offset: number) =>
  line.end + offset;

export const formatTime = (seconds: number, precise = false) => {
  if (!Number.isFinite(seconds)) return precise ? "0:00.00" : "0:00";
  const sign = seconds < 0 ? "-" : "";
  const ticks = precise
    ? Math.round(Math.abs(seconds) * 100)
    : Math.floor(Math.abs(seconds)) * 100;
  const minutes = Math.floor(ticks / 6000);
  const wholeSeconds = Math.floor(ticks / 100) % 60;
  const fraction = precise
    ? `.${(ticks % 100).toString().padStart(2, "0")}`
    : "";
  return `${sign}${minutes}:${wholeSeconds.toString().padStart(2, "0")}${fraction}`;
};
