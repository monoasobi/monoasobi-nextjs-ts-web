"use client";

import { Flex, Spinner, Text } from "@radix-ui/themes";

export const Loading = ({ label = "불러오는 중입니다." }: { label?: string }) => (
  <Flex width="100%" minHeight="160px" p="4" gap="3" direction="column" justify="center" align="center" role="status" aria-live="polite">
    <Spinner size="3" />
    <Text size="2" color="gray">{label}</Text>
  </Flex>
);
