import {
  NovelHR,
  NovelLI,
  NovelP,
  NovelQuote,
  NovelUL,
} from "@components/NovelMarkdown.styles";
import { fontAtom } from "@atoms/font.atom";
import { Heading, Text } from "@radix-ui/themes";
import { useAtomValue } from "jotai";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

interface NovelMarkdownProps {
  children: string;
  className?: string;
}

export const NovelMarkdown = ({ children, className }: NovelMarkdownProps) => {
  const font = useAtomValue(fontAtom);

  return (
    <ReactMarkdown
      className={className}
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
        p: ({ children }) => <NovelP as="p" $font={font}>{children}</NovelP>,
        blockquote: ({ children }) => <NovelQuote>{children}</NovelQuote>,
        hr: (props) => <NovelHR {...props} />,
        ul: (props) => <NovelUL {...props} />,
        li: (props) => {
          const { children } = props;
          const text = children?.toString();
          const match = text!.match(/^(.+?)\s*(「.*」)$/);
          if (!match) return <NovelLI $font={font} {...props} />;
          const [, speaker, dialogue] = match;
          return (
            <NovelLI $font={font}>
              <Text color="red" weight="bold" mr="2">
                {speaker}
              </Text>
              <Text>{dialogue}</Text>
            </NovelLI>
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
  );
};
