"use client";

import { NovelMarkdown } from "@components/content/NovelMarkdown";
import { Card, Code, Flex, Heading, ScrollArea, Text } from "@radix-ui/themes";
import styles from "./Guide.module.css";

interface GuideItemProps {
  title: string;
  description?: string;
  syntax: string;
  preview: string;
}

const GUIDE_ITEMS: GuideItemProps[] = [
  {
    title: "H1 - 작품 제목",
    description: "크고 굵은 제목. 작품 전체 제목에 사용합니다.",
    syntax: "# 밤을 달려라",
    preview: "# 밤을 달려라",
  },
  {
    title: "H2 - 장·챕터 제목",
    description: "가운데 정렬된 중간 크기 제목. 장이나 챕터 구분에 사용합니다.",
    syntax: "## 제1장\n\n## 프롤로그",
    preview: "## 제1장\n\n## 프롤로그",
  },
  {
    title: "H3 - 막·장면 제목",
    description:
      "H2와 동일한 크기이나 상하 여백이 더 좁습니다. 막이나 장면 제목에 사용합니다.",
    syntax: "### 1막\n\n### ＊",
    preview: "### 1막\n\n### ＊",
  },
  {
    title: "H4 - 심볼 구분자",
    description: "작은 크기, 가운데 정렬. 소규모 장면 전환이나 이모지 구분자에 사용합니다.",
    syntax: "#### 🌙🌙🌙 🌙🌙🌙 🌙🌙🌙\n\n#### ×××",
    preview: "#### 🌙🌙🌙 🌙🌙🌙 🌙🌙🌙\n\n#### ×××",
  },
  {
    title: "단락 (Paragraph)",
    description:
      "빈 줄로 구분된 일반 텍스트. KoPub Batang 폰트, 첫 줄 들여쓰기가 적용됩니다.",
    syntax: "봄이 지나고 여름이 왔다.\n\n나는 여전히 그 자리에 서 있었다.",
    preview: "봄이 지나고 여름이 왔다.\n\n나는 여전히 그 자리에 서 있었다.",
  },
  {
    title: "줄바꿈 포함 단락",
    description:
      "줄바꿈(엔터)만 해도 <br>로 처리됩니다(remark-breaks). 이 경우 들여쓰기 대신 좌측 마진이 적용됩니다.",
    syntax:
      "세상에는 두 종류의 인간이 있다.\n삶에 대한 본능──「에로스」에 지배되는 인간과,\n죽음에 대한 본능──「타나토스」에 지배되는 인간.",
    preview:
      "세상에는 두 종류의 인간이 있다.\n삶에 대한 본능──「에로스」에 지배되는 인간과,\n죽음에 대한 본능──「타나토스」에 지배되는 인간.",
  },
  {
    title: "수평선 (Horizontal Rule)",
    description: "화면 너비의 50%, 가운데 정렬. 시간·장면 전환에 사용합니다.",
    syntax: "이전 장면\n\n---\n\n다음 장면",
    preview: "이전 장면\n\n---\n\n다음 장면",
  },
  {
    title: "인용구 (Blockquote)",
    description:
      "배경색 박스 형태. 편지·메시지·작중 문서 등 인용 형식의 텍스트에 사용합니다.",
    syntax:
      "> 치요코\n>\n> 잘 지내? 나는 오늘 드디어 기말고사가 끝났어.\n>\n> 토키토가",
    preview:
      "> 치요코\n>\n> 잘 지내? 나는 오늘 드디어 기말고사가 끝났어.\n>\n> 토키토가",
  },
  {
    title: "대사 리스트 - 화자 「대사」",
    description:
      "리스트 항목이 화자 「대사」 패턴이면 화자명은 빨간 굵은 글씨로, 대사는 일반 텍스트로 자동 분리됩니다. 반드시 「」(일본어 괄호)를 사용해야 합니다.",
    syntax:
      "- 겟토 「안 죽었어? 나, 설마 죽지 않은거야?」\n- 초승달 「잠시 이야기 할까」\n- 겟토 「초승달이… 말을 하고 있어?」",
    preview:
      "- 겟토 「안 죽었어? 나, 설마 죽지 않은거야?」\n- 초승달 「잠시 이야기 할까」\n- 겟토 「초승달이… 말을 하고 있어?」",
  },
  {
    title: "일반 목록 (Unordered List)",
    description: "패턴에 맞지 않는 일반 리스트 항목. KoPub Batang 폰트가 적용됩니다.",
    syntax: "- 첫 번째 항목\n- 두 번째 항목\n- 세 번째 항목",
    preview: "- 첫 번째 항목\n- 두 번째 항목\n- 세 번째 항목",
  },
  {
    title: "강조 (Bold / Strong)",
    description:
      "**텍스트**는 빨간색 굵은 글씨로 렌더링됩니다. 화자 이름 레이블이나 강조 키워드에 사용합니다.",
    syntax: "**【겟토】**\n알고 있지? 왜 내가 죽으려고 한건지.",
    preview: "**【겟토】**\n알고 있지? 왜 내가 죽으려고 한건지.",
  },
];

export const Guide = () => {
  return (
    <ScrollArea className={styles.container} scrollbars="vertical">
      <Flex className={styles.pageFrame} justify="center">
        <Flex className={styles.inner} direction="column" gap="5">
          <Flex direction="column" gap="1">
            <Heading as="h1" size="6">
              NovelReader 작성 가이드
            </Heading>
            <Text size="2" color="gray">
              소설 마크다운 파일에서 사용할 수 있는 문법과 실제 렌더링
              결과입니다.
            </Text>
          </Flex>
          {GUIDE_ITEMS.map((item) => (
            <GuideItem key={item.title} {...item} />
          ))}
        </Flex>
      </Flex>
    </ScrollArea>
  );
};

const GuideItem = ({ title, description, syntax, preview }: GuideItemProps) => (
  <Card className={styles.sectionCard}>
    <Flex direction="column" gap="3">
      <Flex direction="column" gap="1">
        <Heading as="h2" size="3">
          {title}
        </Heading>
        {description && (
          <Text size="2" color="gray">
            {description}
          </Text>
        )}
      </Flex>
      <Flex direction="column" gap="2">
        <Text size="1" color="gray" weight="bold">
          SYNTAX
        </Text>
        <pre className={styles.codeBox}>
          <Code size="2">{syntax}</Code>
        </pre>
      </Flex>
      <Flex align="center" gap="2">
        <Text className={styles.arrow} size="2" color="gray">
          ↓ 렌더링 결과
        </Text>
      </Flex>
      <div className={styles.previewBox}>
        <NovelMarkdown>{preview}</NovelMarkdown>
      </div>
    </Flex>
  </Card>
);
