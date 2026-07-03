"use client";

import type { LyricLine } from "@appTypes/lyric";
import { Flex, Select, Text, TextArea, TextField } from "@radix-ui/themes";
import styles from "../LyricTimelineEditor.module.css";
import type { TimelineEdge } from "./useTimelineResize";
import { NONE_CALL_TYPE } from "./timelineUtils";

interface TimelineLinePopoverProps {
  index: number;
  line: LyricLine;
  onLineTimeChange: (index: number, edge: TimelineEdge, value: string) => void;
  onUpdateLine: (index: number, patch: Partial<LyricLine>) => void;
}

export const TimelineLinePopover = ({
  index,
  line,
  onLineTimeChange,
  onUpdateLine,
}: TimelineLinePopoverProps) => (
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
            onLineTimeChange(index, "start", event.target.value)
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
            onLineTimeChange(index, "end", event.target.value)
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
        onChange={(event) => onUpdateLine(index, { jp: event.target.value })}
      />
    </label>
    <label className={styles.popoverField}>
      <Text size="1" color="gray">
        jpReading
      </Text>
      <TextArea
        value={line.jpReading}
        onChange={(event) =>
          onUpdateLine(index, {
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
        onChange={(event) => onUpdateLine(index, { kr: event.target.value })}
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
            onUpdateLine(index, {
              callType:
                value === NONE_CALL_TYPE
                  ? undefined
                  : (value as LyricLine["callType"]),
            })
          }
        >
          <Select.Trigger />
          <Select.Content>
            <Select.Item value={NONE_CALL_TYPE}>없음</Select.Item>
            <Select.Item value="LOUD">LOUD</Select.Item>
            <Select.Item value="CLAP">CLAP</Select.Item>
            <Select.Item value="CUSTOM">CUSTOM</Select.Item>
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
            onUpdateLine(index, {
              callGuide: event.target.value || undefined,
            })
          }
        />
      </label>
    </Flex>
  </Flex>
);
