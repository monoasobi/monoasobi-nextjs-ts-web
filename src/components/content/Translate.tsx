"use client";

import { Button, Card, Flex, Heading, ScrollArea, Text } from "@radix-ui/themes";
import Link from "next/link";
import styles from "./Translate.module.css";

interface TranslateProps {
  originUrl?: string;
}

export const Translate = ({ originUrl }: TranslateProps) => {
  return (
    <ScrollArea className={styles.container} scrollbars="vertical">
      <Flex className={styles.pageFrame} direction="column">
        <Card className={styles.card}>
          <Flex direction="column" align="center" gap="4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.yoasobi}
              src="/images/assets/yoasobi.jpg"
              alt="yoasobi"
            />
            <Heading>번역본 없음</Heading>
            <Text size="2">해당 작품의 한글 번역본이 존재하지 않습니다.</Text>

            <Flex direction="column" gap="4">
              <Text size="2">
                번역본 기여하기:{" "}
                <a href="mailto:envi.9.official@gmail.com?subject=모노아소비 번역본 기여 문의">
                  envi.9.official@gmail.com
                </a>
              </Text>
              {originUrl && (
                <Button size="1" asChild variant="outline">
                  <Link href={originUrl} target="_blank">
                    원문 보러가기
                  </Link>
                </Button>
              )}
            </Flex>
          </Flex>
        </Card>
      </Flex>
    </ScrollArea>
  );
};
