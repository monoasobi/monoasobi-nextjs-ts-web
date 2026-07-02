"use client";

import type { CallType, LyricLine } from "@appTypes/lyric";
import { HandRaisedIcon, MicrophoneIcon } from "@heroicons/react/24/solid";
import { Badge, Button, Flex, Text } from "@radix-ui/themes";
import { useMemo, useRef } from "react";
import styles from "./LyricsDisplayV2.module.css";

type GroupPos = "solo" | "first" | "middle" | "last";

const TYPE_LABELS: Record<CallType, string> = {
  LOUD: "떼창",
  CLAP: "박수",
  CUSTOM: "콜",
};

const getGroupPos = (lines: LyricLine[], index: number): GroupPos | null => {
  const callType = lines[index].callType;
  if (!callType) return null;

  const prevSame = index > 0 && lines[index - 1].callType === callType;
  const nextSame =
    index < lines.length - 1 && lines[index + 1].callType === callType;

  if (!prevSame && !nextSame) return "solo";
  if (!prevSame && nextSame) return "first";
  if (prevSame && nextSame) return "middle";
  return "last";
};

export interface LyricsDisplayV2Props {
  lyrics: LyricLine[];
  currentTime: number;
  offset: number;
  onSeek: (time: number) => void;
}

export const LyricsDisplayV2 = ({
  lyrics,
  currentTime,
  offset,
  onSeek,
}: LyricsDisplayV2Props) => {
  const adjustedTime = currentTime + offset;
  const lineRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const activeIndex = useMemo(
    () =>
      lyrics.findIndex(
        (line) => adjustedTime >= line.start && adjustedTime < line.end,
      ),
    [adjustedTime, lyrics],
  );

  const callGroupStarts = useMemo(
    () =>
      lyrics.flatMap((line, index) => {
        if (!line.callType) return [];

        const groupPos = getGroupPos(lyrics, index);
        if (groupPos !== "first" && groupPos !== "solo") return [];

        return [
          {
            index,
            startTime: line.start,
            type: line.callType,
            label: line.callGuide || TYPE_LABELS[line.callType],
          },
        ];
      }),
    [lyrics],
  );

  const handleJump = (time: number, index: number) => {
    onSeek(time - offset);
    lineRefs.current
      .get(index)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <Flex className={styles.container} direction="column" gap="2" flexGrow="1">
      <Flex className={styles.header} align="center" gap="2">
        <Flex className={styles.jumpButtons} align="center" gap="1">
          {callGroupStarts.map((group, index) => (
            <Button
              key={`${group.type}-${group.startTime}-${index}`}
              type="button"
              size="1"
              variant="soft"
              color={group.type === "CLAP" ? "amber" : "red"}
              onClick={() => handleJump(group.startTime, group.index)}
            >
              <span className={styles.icon}>
                {group.type === "CLAP" ? (
                  <HandRaisedIcon />
                ) : (
                  <MicrophoneIcon />
                )}
              </span>
              {group.label} {index + 1}
            </Button>
          ))}
        </Flex>
      </Flex>

      <div className={styles.scrollWrapper}>
        <div className={styles.scroll}>
          {lyrics.map((line, index) => {
            const isActive = index === activeIndex;
            const groupPos = getGroupPos(lyrics, index);
            const isGroupStart = groupPos === "solo" || groupPos === "first";

            return (
              <div
                key={`${line.start}-${index}`}
                ref={(element) => {
                  if (element) {
                    lineRefs.current.set(index, element);
                  } else {
                    lineRefs.current.delete(index);
                  }
                }}
                className={styles.line}
                data-active={isActive}
                data-call-type={line.callType ?? undefined}
                data-group-pos={groupPos ?? undefined}
                onClick={() => onSeek(line.start - offset)}
              >
                {line.callType && (isActive || isGroupStart) && (
                  <Badge color={line.callType === "CLAP" ? "amber" : "red"}>
                    {line.callGuide || TYPE_LABELS[line.callType]}
                  </Badge>
                )}
                <p className={styles.japanese}>{line.jp}</p>
                <p className={styles.reading}>{line.jpReading}</p>
                <p className={styles.korean}>{line.kr}</p>
                {line.callGuide && line.callType === "CUSTOM" && (
                  <Text as="p" className={styles.callGuide} size="1" color="gray">
                    {line.callGuide}
                  </Text>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Flex>
  );
};
