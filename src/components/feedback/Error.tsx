"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Card, Flex, Heading, Text } from "@radix-ui/themes";
import styles from "./Error.module.css";

export const Error = () => {
  return (
    <Flex className={styles.container} justify="center" align="center">
      <Card>
        <Flex direction="column" align="center" gap="2" p="4">
          <ExclamationTriangleIcon width={60} color="red" />
          <Heading>오류</Heading>
          <Text>소설을 가져오는데 실패했습니다.</Text>
        </Flex>
      </Card>
    </Flex>
  );
};
