"use client";

/* eslint-disable @next/next/no-img-element */

import { Button, Card, Flex, Heading, ScrollArea, Text } from "@radix-ui/themes";
import Link from "next/link";
import styles from "./SpecialPage.module.css";

export const Players = () => {
  return (
    <ScrollArea className={styles.container} scrollbars="vertical">
      <Flex className={styles.pageFrame} direction="column">
        <Card className={styles.card}>
          <Flex direction="column" align="center" gap="4">
            <img
              className={styles.largeImage}
              src="/images/assets/players1.jpg"
              alt="players"
            />
            <img
              className={styles.largeImage}
              src="/images/assets/players2.jpg"
              alt="memory of play"
            />
            <Heading size="6">#MemoryOfPlay</Heading>

            <Flex direction="column" gap="4" className={styles.desc}>
              <Text size="2">
                「PLAYERS」는 플레이 스테이션 발매 30주년 기념 콜라보레이션
                프로젝트 「Project: MEMORY CARD」를 통해 발매된 곡입니다.
              </Text>
              <Text size="2">
                「플레이스테이션의 기억을 음악에 세이브한다」를 컨셉으로,
                플레이스테이션 공식 X에서 「기억을 지우고 다시 한 번 하고 싶은
                게임」의 에피소드를 공모, 약 3만 여개의 에피소드가 모인
                #MEmoryOfPlay를 원작으로 만들어졌습니다.
              </Text>

              <Button asChild variant="outline">
                <Link
                  href="https://www.yoasobi-music.jp/projectmemorycard/"
                  target="_blank"
                >
                  원문 보러가기
                </Link>
              </Button>
            </Flex>
          </Flex>
        </Card>
      </Flex>
    </ScrollArea>
  );
};
