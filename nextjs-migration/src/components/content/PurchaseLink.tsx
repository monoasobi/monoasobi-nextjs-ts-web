"use client";

import {
  Button,
  Card,
  Flex,
  Heading,
  ScrollArea,
  Separator,
  Text,
} from "@radix-ui/themes";
import Link from "next/link";
import styles from "./PurchaseLink.module.css";

export interface PurchaseLinkBook {
  id: number;
  name: string;
  novels: {
    id: number;
    title: string;
    writer: string;
    musicKorTitle: string;
  }[];
  purchaseLinks: {
    kyoboURL: string;
    yes24URL: string;
    aladinURL: string;
    ridiURL: string;
    naverURL: string;
  };
}

interface PurchaseLinkProps {
  book: PurchaseLinkBook;
}

export const PurchaseLink = ({ book }: PurchaseLinkProps) => {
  return (
    <ScrollArea className={styles.container} scrollbars="vertical">
      <Flex className={styles.pageFrame} direction="column">
        <Card className={styles.card}>
          <Heading>소설집 구매 안내</Heading>
          <Text size="2">
            해당 작품은 국내에 정식으로 발간되어 제공이 불가합니다.
          </Text>
          <Flex
            direction="column"
            justify="center"
            align="center"
            my="4"
            gap="3"
          >
            <Flex
              gap="6"
              width="100%"
              justify="center"
              align={{ md: "end", initial: "center" }}
              direction={{ initial: "column", md: "row" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className={styles.bookImg}
                  src={`/images/books/${book.id}.jpg`}
                  alt={book.name}
                />
              <Flex direction="column" gap="4">
                <Heading align={{ md: "left", initial: "center" }}>
                  {book.name}
                </Heading>
                <Separator size="4" />
                <Flex direction="column" gap="2">
                  {book.novels.map((novel) => (
                    <Flex direction="column" gap="1" key={novel.id}>
                      <Text align="center" size="1" color="gray">
                        {`♪ ${novel.musicKorTitle}`}
                      </Text>
                      <Text
                        align="center"
                        size="2"
                        color="gray"
                      >{`${novel.writer} <${novel.title}>`}</Text>
                    </Flex>
                  ))}
                  <Text align="center" size="2" color="red" weight="medium">
                    총 {book.novels.length}편 수록
                  </Text>
                </Flex>
                <Flex wrap="wrap" gap="2" justify="center">
                  {book.purchaseLinks.kyoboURL && (
                    <Button asChild>
                      <Link href={book.purchaseLinks.kyoboURL} target="_blank">
                        교보문고
                      </Link>
                    </Button>
                  )}
                  {book.purchaseLinks.yes24URL && (
                    <Button asChild>
                      <Link href={book.purchaseLinks.yes24URL} target="_blank">
                        yes24
                      </Link>
                    </Button>
                  )}
                  {book.purchaseLinks.aladinURL && (
                    <Button asChild>
                      <Link href={book.purchaseLinks.aladinURL} target="_blank">
                        알라딘
                      </Link>
                    </Button>
                  )}
                  {book.purchaseLinks.ridiURL && (
                    <Button asChild>
                      <Link href={book.purchaseLinks.ridiURL} target="_blank">
                        리디북스
                      </Link>
                    </Button>
                  )}
                  {book.purchaseLinks.naverURL && (
                    <Button asChild>
                      <Link href={book.purchaseLinks.naverURL} target="_blank">
                        네이버 시리즈
                      </Link>
                    </Button>
                  )}
                </Flex>
              </Flex>
            </Flex>
          </Flex>
        </Card>
      </Flex>
    </ScrollArea>
  );
};
