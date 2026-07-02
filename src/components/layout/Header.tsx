"use client";

import { appearanceAtom } from "@atoms/appearance.atom";
import { fontAtom } from "@atoms/font.atom";
import { sidebarAtom } from "@atoms/sidebar.atom";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { Bars3Icon } from "@heroicons/react/24/solid";
import {
  Button,
  Flex,
  IconButton,
  Popover,
  SegmentedControl,
  Text,
} from "@radix-ui/themes";
import { useAtom, useSetAtom } from "jotai";
import Link from "next/link";
import type { MouseEventHandler } from "react";
import styles from "./Header.module.css";

export const Header = () => {
  const [appearance, setAppearance] = useAtom(appearanceAtom);
  const [font, setFont] = useAtom(fontAtom);
  const setIsSidebar = useSetAtom(sidebarAtom);

  const sidebarHandler: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    setIsSidebar((prev) => !prev);
  };

  return (
    <header className={styles.header}>
      <IconButton
        type="button"
        onClick={sidebarHandler}
        variant="ghost"
        aria-label="사이드바 열기"
      >
        <Bars3Icon width={24} />
      </IconButton>

      <Button asChild variant="ghost" className={styles.logoButton}>
        <Link href="/" aria-label="monoasobi 홈">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo.svg" alt="monoasobi" className={styles.logo} />
        </Link>
      </Button>

      <Popover.Root>
        <Popover.Trigger>
          <IconButton type="button" variant="ghost" aria-label="설정">
            <Cog6ToothIcon width={24} />
          </IconButton>
        </Popover.Trigger>
        <Popover.Content align="end">
          <Flex direction="column" gap="3">
            <Flex direction="column" gap="2">
              <Text size="1" weight="bold" color="gray">
                테마
              </Text>
              <SegmentedControl.Root
                variant="classic"
                value={appearance}
                onValueChange={(value) =>
                  setAppearance(value as "light" | "dark")
                }
                size="1"
              >
                <SegmentedControl.Item value="light">
                  <Text weight="bold">라이트</Text>
                </SegmentedControl.Item>
                <SegmentedControl.Item value="dark">
                  <Text weight="bold">다크</Text>
                </SegmentedControl.Item>
              </SegmentedControl.Root>
            </Flex>

            <Flex direction="column" gap="2">
              <Text size="1" weight="bold" color="gray">
                폰트
              </Text>
              <SegmentedControl.Root
                value={font}
                onValueChange={(value) => setFont(value as "gothic" | "batang")}
                size="1"
              >
                <SegmentedControl.Item value="gothic">
                  <Text weight="bold">Pretendard</Text>
                </SegmentedControl.Item>
                <SegmentedControl.Item value="batang">
                  <Text weight="bold" className={styles.batangText}>
                    Kopub 바탕
                  </Text>
                </SegmentedControl.Item>
              </SegmentedControl.Root>
            </Flex>
          </Flex>
        </Popover.Content>
      </Popover.Root>
    </header>
  );
};
