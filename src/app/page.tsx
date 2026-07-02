import { Overview } from "@components/custom/Overview";
import { createPageMetadata } from "@lib/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = createPageMetadata({
  description: "요아소비 원작 소설 번역과 관련 콘텐츠를 모아 읽는 팬 사이트",
  path: "/",
});

export default function Home() {
  return <Overview />;
}
