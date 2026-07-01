"use client";

import { Error as ErrorView } from "@components/feedback/Error";
import { Loading } from "@components/feedback/Loading";
import { Flex, ScrollArea } from "@radix-ui/themes";
import { useEffect, useRef, useState, type UIEvent } from "react";
import { NovelMarkdown } from "./NovelMarkdown";
import styles from "./NovelReader.module.css";

interface NovelReaderProps {
  id: number | string;
}

export const NovelReader = ({ id }: NovelReaderProps) => {
  const [markdown, setMarkdown] = useState<string | undefined>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const novelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNovel = async (novelId: number | string) => {
      try {
        setIsLoading(true);
        setIsError(false);

        const res = await fetch(`/api/content/novels/${novelId}`);

        if (!res.ok) throw new Error("Failed to fetch novel");
        setMarkdown(await res.text());
      } catch (error) {
        console.error(error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNovel(id);
  }, [id]);

  useEffect(() => {
    if (!markdown) return;
    const novelElement = novelRef.current;
    if (novelElement) {
      const scrollTop = localStorage.getItem(`novel-${id}`);
      if (scrollTop) novelElement.scrollTo(0, parseInt(scrollTop, 10) || 0);
    }
  }, [markdown, id]);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    const scrollTop = el.scrollTop;
    const scrollKey = `novel-${id}`;

    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
      localStorage.removeItem(scrollKey);
    } else {
      localStorage.setItem(scrollKey, scrollTop.toString());
    }
  };

  if (isLoading) return <Loading />;
  if (isError) return <ErrorView />;

  return (
    <ScrollArea
      ref={novelRef}
      className={styles.container}
      onScroll={handleScroll}
      scrollbars="vertical"
    >
      <Flex className={styles.readerFrame} justify="center">
        <div className={styles.novelContainer}>
          <NovelMarkdown className={styles.markdown}>
            {markdown ?? ""}
          </NovelMarkdown>
        </div>
      </Flex>
    </ScrollArea>
  );
};
