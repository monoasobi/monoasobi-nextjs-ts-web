"use client";

import { Button, Card, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import styles from "./AdminPage.module.css";

export const AdminLogin = () => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const response = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError(
        response.status === 500
          ? "관리자 환경변수가 설정되지 않았습니다."
          : "비밀번호를 확인해 주세요.",
      );
      return;
    }

    router.refresh();
  };

  return (
    <div className={styles.container}>
      <Card className={styles.loginCard}>
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="4">
            <Flex direction="column" gap="1">
              <Heading size="5">Site Admin</Heading>
              <Text size="2" color="gray">
                DB 데이터를 확인하고 수정하는 관리자 화면입니다.
              </Text>
            </Flex>
            <TextField.Root
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="관리자 비밀번호"
              autoComplete="current-password"
            />
            {error && (
              <Text size="2" color="red">
                {error}
              </Text>
            )}
            <Button type="submit" disabled={isSubmitting || !password}>
              {isSubmitting ? "확인 중" : "로그인"}
            </Button>
          </Flex>
        </form>
      </Card>
    </div>
  );
};
