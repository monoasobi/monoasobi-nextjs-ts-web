"use client";

import { fontAtom } from "@atoms/font.atom";
import { Heading, Text } from "@radix-ui/themes";
import { useAtomValue } from "jotai";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import styles from "./NovelMarkdown.module.css";

interface NovelMarkdownProps {
  children: string;
  className?: string;
}

export const NovelMarkdown = ({ children, className }: NovelMarkdownProps) => {
  const font = useAtomValue(fontAtom);

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkBreaks]}
        components={{
          h1: ({ children }) => (
            <Heading as="h1" size="7" my="6">
              {children}
            </Heading>
          ),
          h2: ({ children }) => (
            <Heading as="h2" my="6" size="6" align="center">
              {children}
            </Heading>
          ),
          h3: ({ children }) => (
            <Heading as="h3" my="2" size="6" align="center">
              {children}
            </Heading>
          ),
          h4: ({ children }) => (
            <Heading as="h3" my="6" size="4" align="center">
              {children}
            </Heading>
          ),
          p: ({ children }) => (
            <Text as="p" className={styles.paragraph} data-font={font}>
              {children}
            </Text>
          ),
          blockquote: ({ children }) => (
            <blockquote className={styles.quote}>{children}</blockquote>
          ),
          hr: (props) => <hr className={styles.hr} {...props} />,
          ul: (props) => <ul className={styles.ul} {...props} />,
          li: (props) => {
            const { children } = props;
            const text = children?.toString();
            const match = text?.match(/^(.+?)\s*(「.*」)$/);

            if (!match) {
              return (
                <li className={styles.li} data-font={font} {...props}>
                  {children}
                </li>
              );
            }

            const [, speaker, dialogue] = match;
            return (
              <li className={styles.li} data-font={font}>
                <Text color="red" weight="bold" mr="2">
                  {speaker}
                </Text>
                <Text>{dialogue}</Text>
              </li>
            );
          },
          strong: ({ children }) => (
            <Text color="red" weight="bold">
              {children}
            </Text>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};
