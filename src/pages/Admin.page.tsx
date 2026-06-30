import { adminAtom } from "@atoms/admin.atom";
import { Loading } from "@components/Loading";
import {
  Box,
  Button,
  Flex,
  ScrollArea,
  Text,
  TextField,
} from "@radix-ui/themes";
import { useSetAtom } from "jotai";
import { KeyboardEventHandler, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";

const Container = styled(ScrollArea)`
  width: 100%;
  height: calc(100dvh - 56px);

  .rt-ScrollAreaViewport {
    line-height: 160%;
    padding: 24px;
  }

  .card {
    padding: 16px;
    overflow: visible;
  }

  .yoasobi {
    width: 90%;
    max-width: 960px;
  }

  .logo {
    width: 240px;
  }

  .desc {
    width: 90%;
    max-width: 480px;
  }

  .admin {
    margin-top: 16px;
    opacity: 0;
    align-self: flex-end;
    transition: opacity 0.7s ease-in-out;
    &:hover {
      opacity: 1;
    }
  }
`;

const PageFrame = styled(Flex)`
  position: relative;
  min-height: 100%;
`;

const LoadingContainer = styled(Box)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.6);
`;

export const Admin = () => {
  const [pw, setPw] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const setIsAdmin = useSetAtom(adminAtom);
  const navigate = useNavigate();

  const adminHandler = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_WORKER_URL}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pw }),
      });
      if (response.ok) {
        setIsAdmin(true);
        alert("관리자 기능이 활성화 되었습니다.");
        navigate("/");
      } else {
        setIsAdmin(false);
        alert("비밀번호가 틀렸습니다.");
      }
    } catch (error) {
      console.log(error);
      setIsAdmin(false);
      alert("관리자 인증 오류입니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const enterHandler: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") return adminHandler();
  };
  return (
    <Container scrollbars="vertical">
      <PageFrame className="dialog" direction="column" gap="2">
        <label>
          <Text as="div" size="1" mb="1" weight="light">
            관리자 비밀번호
          </Text>
          <TextField.Root
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyUp={enterHandler}
            type="password"
            placeholder="관리자 비밀번호"
          />
        </label>
        <Button onClick={adminHandler}>확인</Button>
        {isLoading && (
          <LoadingContainer>
            <Loading />
          </LoadingContainer>
        )}
      </PageFrame>
    </Container>
  );
};
