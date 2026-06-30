import { RouteShell } from "@/app/_components/RouteShell";

export default function GuidePage() {
  return (
    <RouteShell
      title="NovelReader 작성 가이드"
      description="기존 /guide 문법 안내 페이지를 옮길 자리입니다."
      source="src/pages/Guide.page.tsx"
    />
  );
}
