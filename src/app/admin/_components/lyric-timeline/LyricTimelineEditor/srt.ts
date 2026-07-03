import type { LyricLine } from "@appTypes/lyric";

export const SRT_EXPORTS = [
  { key: "jp", label: "일어", suffix: "일어" },
  { key: "jpReading", label: "독음", suffix: "독음" },
  { key: "kr", label: "한글", suffix: "한글" },
] as const;

export type SrtExportConfig = (typeof SRT_EXPORTS)[number];

const formatSrtTime = (seconds: number) => {
  const totalMilliseconds = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(totalMilliseconds / 3_600_000);
  const minutes = Math.floor((totalMilliseconds % 3_600_000) / 60_000);
  const wholeSeconds = Math.floor((totalMilliseconds % 60_000) / 1000);
  const milliseconds = totalMilliseconds % 1000;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${wholeSeconds
    .toString()
    .padStart(2, "0")},${milliseconds.toString().padStart(3, "0")}`;
};

export const sanitizeFilePart = (value: string) =>
  value
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ") || "lyrics";

export const buildSrt = (
  lyrics: LyricLine[],
  textKey: SrtExportConfig["key"],
) =>
  lyrics
    .map((line, index) => {
      const start = formatSrtTime(line.start);
      const end = formatSrtTime(line.end);
      const text = line[textKey].trim();

      return `${index + 1}\r\n${start} --> ${end}\r\n${text}\r\n`;
    })
    .join("\r\n");

export const downloadTextFile = (filename: string, content: string) => {
  const blob = new Blob([`\uFEFF${content}`], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
