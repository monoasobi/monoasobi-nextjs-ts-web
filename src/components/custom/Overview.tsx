import {
  BookOpenIcon,
  HeartIcon,
  LanguageIcon,
  MusicalNoteIcon,
  PlayCircleIcon,
  RectangleStackIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  Card,
  Flex,
  Heading,
  ScrollArea,
  Text,
} from "@radix-ui/themes";
import Image from "next/image";
import Link from "next/link";
import styles from "./Overview.module.css";

const LOGO_IMAGE = "/images/assets/logowith.svg";

interface FeatureItem {
  icon: typeof BookOpenIcon;
  title: string;
  description: string;
  to?: string;
  action?: string;
}

const features: FeatureItem[] = [
  {
    icon: BookOpenIcon,
    title: "YOASOBI 노래의 원작 읽기",
    description:
      "YOASOBI 음악의 원작 소설을 곡별로 정리하고, 한국어 번역본을 바로 읽을 수 있게 제공합니다.",
  },
  {
    icon: MusicalNoteIcon,
    title: "소설을 읽은 후 가사 곱씹어보기",
    description:
      "작품 페이지 우측 하단의 버튼을 누르면 해당 곡의 MV와 싱크 가사 화면으로 전환됩니다.",
  },
  {
    icon: RectangleStackIcon,
    title: "코믹스와 스페셜 콘텐츠",
    description:
      "「舞台に立って」처럼 소설 외 원작이 있는 곡은 코믹스와 별도 안내 페이지로 묶어 제공합니다.",
  },
  {
    icon: ShoppingBagIcon,
    title: "정식 출판본 안내",
    description:
      "국내 정식 출판으로 전문을 제공하기 어려운 작품은 수록 도서와 구매처를 안내합니다.",
  },
];

export const Overview = () => {
  return (
    <ScrollArea className={styles.container} scrollbars="vertical">
      <main className={styles.page}>
        <section className={styles.hero}>
          <Flex className={styles.heroInner} direction="column" gap="5">
            <Flex direction="column" gap="3">
              <Heading as="h1" size="8">
                YOASOBI 음악 너머의 이야기를 발견하다
              </Heading>
              <Text className={styles.heroCopy} size="4">
                모노아소비는 요아소비(YOASOBI)의 음악이 원작으로 삼고 있는
                소설과 번역본, 가사를 한곳에 모아 제공하는 사이트입니다.
              </Text>
            </Flex>
          </Flex>
        </section>

        <section className={styles.noticeBand}>
          <section className={styles.section}>
            <Flex className={styles.sectionInner} direction="column" gap="4">
              <Flex direction="column" gap="2">
                <Text className={styles.eyebrow} size="2">
                  ABOUT
                </Text>
                <Heading as="h2" size="6">
                  MONOASOBI?
                </Heading>
              </Flex>
              <Flex direction="column" gap="3">
                <Image
                  className={styles.logo}
                  src={LOGO_IMAGE}
                  alt="logo"
                  width={400}
                  height={128}
                />
                <Text size="3">
                  모노아소비는 요아소비(YOASOBI)의 음악이 원작으로 삼고 있는
                  소설과 그 번역본을 한곳에 모아 제공하는 사이트입니다.
                </Text>
                <Text size="3">
                  모노아소비는 더 많은 사람들이 원작 소설을 즐길 수 있도록 돕고,
                  요아소비의 음악을 더욱 깊이 사랑하게 되기를 바라는 마음으로
                  운영됩니다.
                </Text>
                <Text size="3">
                  사이트에 게시된 모든 원작 소설과 번역본의 저작권은 각각의
                  작가와 번역자에게 있으며, 모노아소비는 이 자료들을
                  공유함으로써 어떠한 상업적 이익도 추구하지 않습니다.
                </Text>
              </Flex>
            </Flex>
          </section>
        </section>

        <section className={styles.section}>
          <Flex className={styles.sectionInner} direction="column" gap="5">
            <Flex direction="column" gap="2">
              <Text className={styles.eyebrow} size="2">
                FEATURES
              </Text>
              <Heading as="h2" size="7">
                콘텐츠와 기능
              </Heading>
            </Flex>
            <div className={styles.featureGrid}>
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card className={styles.featureCard} key={feature.title}>
                    <Flex direction="column" gap="4">
                      <Flex
                        className={styles.iconShell}
                        align="center"
                        justify="center"
                      >
                        <Icon width={22} height={22} />
                      </Flex>
                      <Flex direction="column" gap="2">
                        <Heading as="h3" size="4">
                          {feature.title}
                        </Heading>
                        <Text size="2" color="gray">
                          {feature.description}
                        </Text>
                      </Flex>
                      {feature.to && feature.action && (
                        <Button size="2" variant="soft" asChild>
                          <Link href={feature.to}>{feature.action}</Link>
                        </Button>
                      )}
                    </Flex>
                  </Card>
                );
              })}
            </div>
          </Flex>
        </section>

        <section className={styles.section}>
          <Flex className={styles.sectionInner} direction="column" gap="5">
            <Flex direction="column" gap="2">
              <Text className={styles.eyebrow} size="2">
                MELTIN&apos; FLOW
              </Text>
              <Heading as="h2" size="7">
                주인장 추천 루트
              </Heading>
            </Flex>

            <Card className={styles.routeCard}>
              <Flex
                className={styles.routeStep}
                align="center"
                justify="between"
                gap="4"
              >
                <Text size="3" weight="bold">
                  소설을 읽는다
                </Text>
                <div className={styles.routeIconContain}>
                  <BookOpenIcon width={24} height={24} />
                </div>
              </Flex>
              <Flex
                className={styles.routeStep}
                align="center"
                justify="between"
                gap="4"
              >
                <Text size="3" weight="bold">
                  번역된 가사와 함께 노래를 들으며 아야세의 작사 실력에 감탄한다
                </Text>
                <div className={styles.routeIconContain}>
                  <MusicalNoteIcon width={24} height={24} />
                </div>
              </Flex>
              <Flex
                className={styles.routeStep}
                align="center"
                justify="between"
                gap="4"
              >
                <Text size="3" weight="bold">
                  뮤직비디오를 감상하며 소설에 등장한 디테일을 발견하고 감탄한다
                </Text>
                <div className={styles.routeIconContain}>
                  <PlayCircleIcon width={24} height={24} />
                </div>
              </Flex>
              <Flex
                className={styles.routeStep}
                align="center"
                justify="between"
                gap="4"
              >
                <Text size="3" weight="bold" color="red">
                  입덕완료!
                </Text>
                <div className={styles.routeIconContain}>
                  <HeartIcon width={24} height={24} />
                </div>
              </Flex>
            </Card>
          </Flex>
        </section>

        <section className={styles.section}>
          <Flex className={styles.sectionInner} direction="column" gap="4">
            <Flex align="center" gap="3">
              <Flex
                className={styles.iconShell}
                align="center"
                justify="center"
              >
                <LanguageIcon width={22} height={22} />
              </Flex>
              <Flex direction="column" gap="1">
                <Heading as="h2" size="5">
                  번역 투고 및 기타 문의
                </Heading>
                <Text size="2" color="gray">
                  번역본 제공, 출처 수정, 사이트 관련 문의를 받을 수 있습니다.
                </Text>
              </Flex>
            </Flex>
            <Button size="3" variant="outline" asChild>
              <a href="mailto:envi.9.official@gmail.com?subject=모노아소비 문의">
                envi.9.official@gmail.com
              </a>
            </Button>
          </Flex>
        </section>
      </main>
    </ScrollArea>
  );
};
