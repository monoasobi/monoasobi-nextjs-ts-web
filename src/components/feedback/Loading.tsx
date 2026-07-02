"use client";

import { Flex } from "@radix-ui/themes";
import { OrbitProgress } from "react-loading-indicators";
import styles from "./Loading.module.css";

export const Loading = () => {
  return (
    <Flex className={styles.container} justify="center" align="center">
      <OrbitProgress color="#e3004e" size="large" />
    </Flex>
  );
};
