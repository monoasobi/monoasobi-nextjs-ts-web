"use client";

import { Button, Card, Flex, Heading, Text, TextField } from "@radix-ui/themes";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import styles from "./AdminPage.module.css";

export const AdminLogin = () => {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || isRefreshing) return;
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        setError(response.status === 500
          ? "관리자 환경변수가 설정되지 않았습니다."
          : "비밀번호를 확인해 주세요.");
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setError("로그인에 실패했습니다. 연결을 확인하고 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
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
              disabled={isSubmitting || isRefreshing}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="관리자 비밀번호"
              autoComplete="current-password"
            />
            {error && (
              <Text role="alert" size="2" color="red">
                {error}
              </Text>
            )}
            <Button type="submit" loading={isSubmitting || isRefreshing} disabled={!password}>
              {isRefreshing ? "관리자 화면을 불러오는 중" : isSubmitting ? "확인 중" : "로그인"}
            </Button>
          </Flex>
        </form>
      </Card>
    </div>
  );
};
