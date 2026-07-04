import type { LyricLine } from "@appTypes/lyric";
import { roundTime } from "../time";

export const ZOOM_FACTOR = 1.18;
export const TICK_SECONDS = 5;
export const NONE_CALL_TYPE = "NONE";

export const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      "input, textarea, select, [role='slider'], [contenteditable='true']",
    ),
  );
};

export const isButtonTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("button"));
};

export const getNormalizedLyrics = (lyrics: LyricLine[]) =>
  lyrics.map((line) => ({
    ...line,
    start: roundTime(line.start),
    end: roundTime(line.end),
  }));

export const getTimelineTicks = (timelineStart: number, timelineEnd: number) => {
  const ticks: number[] = [];

  for (
    let time = Math.ceil(timelineStart / TICK_SECONDS) * TICK_SECONDS;
    time <= timelineEnd;
    time += TICK_SECONDS
  ) {
    ticks.push(time);
  }

  return ticks;
};
