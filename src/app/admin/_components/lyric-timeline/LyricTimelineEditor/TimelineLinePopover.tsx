"use client";

import type { LyricLine } from "@appTypes/lyric";
import {
  AlertDialog,
  Button,
  Flex,
  Select,
  Text,
  TextArea,
  TextField,
} from "@radix-ui/themes";
import { useState } from "react";
import styles from "../LyricTimelineEditor.module.css";
import { MIN_LINE_DURATION, roundTime } from "../time";
import type { TimelineEdge } from "./useTimelineResize";
import { NONE_CALL_TYPE } from "./timelineUtils";

interface TimelineLinePopoverProps {
  currentTime: number;
  draftSync: number;
  index: number;
  line: LyricLine;
  onDelete: (index: number) => void;
  onLineTimeChange: (index: number, edge: TimelineEdge, value: string) => void;
  onSplit: (index: number) => void;
  onUpdateLine: (index: number, patch: Partial<LyricLine>) => void;
}

export const TimelineLinePopover = ({
  currentTime,
  draftSync,
  index,
  line,
  onDelete,
  onLineTimeChange,
  onSplit,
  onUpdateLine,
}: TimelineLinePopoverProps) => {
  const [isSplitDialogOpen, setIsSplitDialogOpen] = useState(false);
  const splitTime = roundTime(currentTime - draftSync);
  const canSplit =
    splitTime > line.start + MIN_LINE_DURATION &&
    splitTime < line.end - MIN_LINE_DURATION;

  const handleSplit = () => {
    if (!canSplit) {
      setIsSplitDialogOpen(true);
      return;
    }

    onSplit(index);
  };

  return (
    <Flex direction="column" gap="3">
      <Text size="2" weight="bold">
        Line {index + 1}
      </Text>
      <Flex gap="2" wrap="wrap">
        <Button type="button" variant="soft" onClick={handleSplit}>
          분할
        </Button>
        <AlertDialog.Root>
          <AlertDialog.Trigger>
            <Button type="button" color="red" variant="soft">
              삭제
            </Button>
          </AlertDialog.Trigger>
          <AlertDialog.Content maxWidth="420px">
            <AlertDialog.Title>Line {index + 1}을 삭제할까요?</AlertDialog.Title>
            <AlertDialog.Description size="2">
              삭제한 라인은 저장 전까지는 초기화로 되돌릴 수 있습니다.
            </AlertDialog.Description>
            <Flex mt="4" gap="3" justify="end">
              <AlertDialog.Cancel>
                <Button type="button" variant="soft" color="gray">
                  취소
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action>
                <Button
                  type="button"
                  color="red"
                  onClick={() => onDelete(index)}
                >
                  삭제
                </Button>
              </AlertDialog.Action>
            </Flex>
          </AlertDialog.Content>
        </AlertDialog.Root>
      </Flex>
      <AlertDialog.Root
        open={isSplitDialogOpen}
        onOpenChange={setIsSplitDialogOpen}
      >
        <AlertDialog.Content maxWidth="420px">
          <AlertDialog.Title>분할 위치를 지정해주세요.</AlertDialog.Title>
          <AlertDialog.Description size="2">
            인디케이터를 이 블록 안쪽에 놓은 뒤 다시 분할해주세요.
          </AlertDialog.Description>
          <Flex mt="4" justify="end">
            <AlertDialog.Action>
              <Button type="button">확인</Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
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
};
