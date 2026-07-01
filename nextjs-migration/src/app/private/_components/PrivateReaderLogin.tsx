"use client";

import { privateReaderAtom } from "@atoms/privateReader.atom";
import { Loading } from "@components/feedback/Loading";
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  ScrollArea,
  Text,
  TextField,
} from "@radix-ui/themes";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import styles from "./PrivateReaderLogin.module.css";

export const PrivateReaderLogin = () => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasPrivateReaderAccess, setHasPrivateReaderAccess] =
    useAtom(privateReaderAtom);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsLoading(true);
      const response = await fetch("/api/private-reader/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        setHasPrivateReaderAccess(true);
        router.push("/");
        router.refresh();
        return;
      }

      setHasPrivateReaderAccess(false);
      alert("비밀번호가 틀렸습니다.");
    } catch (error) {
      console.error(error);
      setHasPrivateReaderAccess(false);
      alert("제한 콘텐츠 열람 인증 오류입니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await fetch("/api/private-reader/auth/logout", { method: "POST" });
      setHasPrivateReaderAccess(false);
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollArea className={styles.container} scrollbars="vertical">
      <Flex className={styles.pageFrame} align="center" justify="center">
        <Card className={styles.card}>
          <Flex direction="column" gap="4">
            <Flex direction="column" gap="1">
              <Heading size="5">콘텐츠 열람</Heading>
              <Text size="2" color="gray">
                열람 권한을 활성화합니다.
              </Text>
            </Flex>

            {hasPrivateReaderAccess ? (
              <Flex direction="column" gap="3">
                <Text size="2" color="gray">
                  현재 콘텐츠 열람 권한이 활성화되어 있습니다.
                </Text>
                <Button type="button" variant="outline" onClick={handleLogout}>
                  권한 비활성화
                </Button>
              </Flex>
            ) : (
              <form onSubmit={handleSubmit}>
                <Flex direction="column" gap="3">
                  <label>
                    <Text as="div" size="1" mb="1" weight="light">
                      비밀번호
                    </Text>
                    <TextField.Root
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      type="password"
                      placeholder="비밀번호"
                      autoComplete="current-password"
                    />
                  </label>
                  <Button type="submit">확인</Button>
                </Flex>
              </form>
            )}
          </Flex>
          {isLoading && (
            <Box className={styles.loadingOverlay}>
              <Loading />
            </Box>
          )}
        </Card>
      </Flex>
    </ScrollArea>
  );
};
