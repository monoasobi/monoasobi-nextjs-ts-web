"use client";

import type { LyricLine } from "@appTypes/lyric";
import type { Music } from "@appTypes/music";
import { roundTime } from "@components/common/YouTubeLyricsPlayer/time";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { Button, Flex, Text } from "@radix-ui/themes";
import {
  SRT_EXPORTS,
  buildSrt,
  downloadTextFile,
  sanitizeFilePart,
  type SrtExportConfig,
} from "./AdminSrtExport/srt";

export interface AdminSrtExportProps {
  music: Pick<Music, "id" | "title" | "korTitle">;
  lyrics: LyricLine[];
}

export const AdminSrtExport = ({ music, lyrics }: AdminSrtExportProps) => {
  const download = (config: SrtExportConfig) => {
    const normalized = lyrics.map((line) => ({
      ...line,
      start: roundTime(line.start),
      end: roundTime(line.end),
    }));
    const filename = `${music.id}_${sanitizeFilePart(music.korTitle || music.title)} ${config.suffix}.srt`;
    downloadTextFile(filename, buildSrt(normalized, config.key));
  };

  return (
    <Flex direction="column" gap="2">
      <Text size="1" color="gray" weight="bold">
        SRT Export
      </Text>
      <Flex gap="1" wrap="wrap">
        {SRT_EXPORTS.map((config) => (
          <Button
            key={config.key}
            type="button"
            size="1"
            variant="soft"
            color="gray"
            onClick={() => download(config)}
          >
            <ArrowDownTrayIcon width="14" height="14" />
            {config.label}
          </Button>
        ))}
      </Flex>
    </Flex>
  );
};
