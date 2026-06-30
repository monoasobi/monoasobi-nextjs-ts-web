import { adminAtom } from "@atoms/admin.atom";
import { Error } from "@components/Error";
import { Loading } from "@components/Loading";
import { NovelMarkdown } from "@components/NovelMarkdown";
import { Flex, ScrollArea } from "@radix-ui/themes";
import { useAtomValue } from "jotai";
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

const Container = styled(ScrollArea)`
  width: 100%;
  height: calc(100dvh - 72px);

  .rt-ScrollAreaViewport {
    line-height: 160%;
    padding: 64px 24px 24px;
  }

  @media (max-width: 480px) {
    .rt-ScrollAreaViewport {
      padding: 64px 16px 24px;
    }
  }
`;

const ReaderFrame = styled(Flex)`
  width: 100%;
  min-height: 100%;
`;

const NovelContainer = styled.div`
  width: 100%;
  min-height: 100%;
  max-width: 720px;
  padding: 1rem;
  .markdown {
    padding-bottom: 24px;
  }
`;

interface NovelProps {
  id: number | string;
}

export const NovelReader = ({ id }: NovelProps) => {
  const [markdown, setMarkdown] = useState<string | undefined>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const novelRef = useRef<HTMLDivElement>(null);
  const admin = useAtomValue(adminAtom);
  useEffect(() => {
    const fetchNovel = async (novelId: number | string) => {
      try {
        setIsLoading(true);
        setIsError(false);

        // 개발 모드에서 먼저 시도
        if (import.meta.env.MODE === "development") {
          try {
            const res = await fetch(`${location.origin}/novel/${id}.md`);
            const contentType = res.headers.get("content-type");
            console.log(contentType);
            if (!res.ok || !contentType?.includes("text/markdown"))
              throw Error();
            const data = await res.text();
            setMarkdown(data);
            return; // 성공하면 여기서 종료
          } catch (devError) {
            console.warn(
              "Development mode fetch failed, falling back to production:",
              devError,
            );
            // 개발 모드 실패 시 아래 프로덕션 로직으로 fallback
          }
        }

        // 프로덕션 로직 (또는 개발 모드 fallback)
        const res = await fetch(
          `${import.meta.env.VITE_WORKER_URL}/novel/${novelId}`,
          {
            headers: {
              authorization: admin ? "monoasobi" : "yoasobi",
            },
          },
        );
        console.log(res);
        setMarkdown(await res.text());
      } catch (err) {
        console.error(err);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNovel(id);
  }, [id, admin]);

  useEffect(() => {
    if (!markdown) return;
    const novelElement = novelRef.current;
    if (novelElement) {
      const scrollTop = localStorage.getItem(`novel-${id}`);
      if (scrollTop) novelElement.scrollTo(0, parseInt(scrollTop, 10) || 0);
    }
  }, [markdown, id]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const scrollTop = el.scrollTop;
    const scrollKey = `novel-${id}`;

    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
      localStorage.removeItem(scrollKey); // 끝까지 읽었을 때 삭제
    } else {
      localStorage.setItem(scrollKey, scrollTop.toString()); // 중간 저장
    }
  };

  if (isLoading) return <Loading />;
  if (isError) return <Error />;
  return (
    <Container ref={novelRef} onScroll={handleScroll} scrollbars="vertical">
      <ReaderFrame justify="center">
        <NovelContainer>
          <NovelMarkdown className="markdown">{markdown ?? ""}</NovelMarkdown>
        </NovelContainer>
      </ReaderFrame>
    </Container>
  );
};
