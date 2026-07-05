import { Flex, Spinner, Text } from "@radix-ui/themes";

export default function ComicLoading() {
  return (
    <Flex align="center" justify="center" direction="column" gap="3" height="100%">
      <Spinner />
      <Text size="2" color="gray" weight="medium">
        만화를 불러오는 중입니다.
      </Text>
    </Flex>
  );
}
