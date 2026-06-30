"use client";

/* eslint-disable @next/next/no-img-element */

import { Error as ErrorView } from "@components/feedback/Error";
import { Loading } from "@components/feedback/Loading";
import { Flex, ScrollArea } from "@radix-ui/themes";
import { getFileNum } from "@utils/file";
import { useEffect, useRef, useState, type UIEvent } from "react";
import styles from "./ComicReader.module.css";

interface ComicReaderProps {
  id: number;
}

export const ComicReader = ({ id }: ComicReaderProps) => {
  const comicRef = useRef<HTMLDivElement>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let ignore = false;

    const fetchComic = async (comicId: number) => {
      try {
        setIsLoading(true);
        setIsError(false);

        const res = await fetch(`/api/content/comics/${comicId}`);
        if (!res.ok) throw new Error("Failed to load comic");

        const data = (await res.json()) as string[];
        const sorted = [...data].sort((a, b) => getFileNum(a) - getFileNum(b));
        if (!ignore) setImageUrls(sorted);
      } catch (err) {
        console.error(err);
        if (!ignore) setIsError(true);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    };

    void fetchComic(id);

    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    const comicElement = comicRef.current;
    if (!comicElement || imageUrls.length === 0) return;

    const scrollTop = localStorage.getItem(`comic-${id}`);
    if (scrollTop) comicElement.scrollTo(0, parseInt(scrollTop, 10) || 0);
  }, [imageUrls, id]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const scrollTop = el.scrollTop;
    const scrollKey = `comic-${id}`;

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
      className={styles.container}
      ref={comicRef}
      onScroll={handleScroll}
      scrollbars="vertical"
    >
      <Flex className={styles.readerFrame} justify="center">
        <Flex className={styles.comicContainer} direction="column" gap="3">
          {imageUrls.map((url, idx) => (
            <img
              key={url}
              src={url}
              alt={idx.toString()}
              loading={idx < 4 ? "eager" : "lazy"}
            />
          ))}
        </Flex>
      </Flex>
    </ScrollArea>
  );
};
