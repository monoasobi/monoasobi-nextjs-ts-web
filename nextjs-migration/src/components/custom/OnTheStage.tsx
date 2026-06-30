"use client";

/* eslint-disable @next/next/no-img-element */

import { InformationCircleIcon } from "@heroicons/react/24/outline";
import {
  Button,
  Callout,
  Card,
  Flex,
  Heading,
  ScrollArea,
} from "@radix-ui/themes";
import Link from "next/link";
import styles from "./OnTheStage.module.css";

export const OnTheStage = () => {
  return (
    <ScrollArea className={styles.container} scrollbars="vertical">
      <Flex className={styles.pageFrame} direction="column">
        <Card className={styles.card}>
          <Flex direction="column" gap="4">
            <Callout.Root variant="soft" size="2">
              <Callout.Icon>
                <InformationCircleIcon width={24} />
              </Callout.Icon>
              <Callout.Text>
                「舞台に立って(무대에 서서)」는 소년 점프+ 와의 「NHK 스포츠
                테마 2024」 콜라보레이션 단편 코믹스를 원작으로 하며, 원작
                만화를 토대로 한 소설 역시 공개되어 있습니다.
              </Callout.Text>
            </Callout.Root>

            <Flex direction="column" gap="4">
              <Content
                image="/images/assets/onthestage1.png"
                title="떨어진 두 사람"
                comicHref="/comic/1"
                novelHref="/novel/26"
              />
              <Content
                image="/images/assets/onthestage2.png"
                title="Parallel Lane"
                comicHref="/comic/2"
                novelHref="/novel/27"
              />
              <Content
                image="/images/assets/onthestage3.png"
                title="끝나지 않는 듀스"
                comicHref="/comic/3"
                novelHref="/novel/28"
              />
            </Flex>
          </Flex>
        </Card>
      </Flex>
    </ScrollArea>
  );
};

interface ContentProps {
  image: string;
  title: string;
  comicHref: string;
  novelHref: string;
}

const Content = ({ image, title, comicHref, novelHref }: ContentProps) => (
  <Card className={styles.content} variant="surface">
    <Flex
      direction={{ xs: "row", initial: "column" }}
      gap="4"
      align={{ xs: "end", initial: "center" }}
    >
      <img src={image} alt={title} />
      <Flex direction="column" gap="4" width="100%">
        <Heading size="6" weight="bold" align={{ xs: "left", initial: "center" }}>
          {title}
        </Heading>
        <Flex direction="column" gap="2" width="100%">
          <Button size="3" asChild variant="outline">
            <Link href={comicHref}>코믹스</Link>
          </Button>
          <Button size="3" asChild variant="outline">
            <Link href={novelHref}>소설</Link>
          </Button>
        </Flex>
      </Flex>
    </Flex>
  </Card>
);
