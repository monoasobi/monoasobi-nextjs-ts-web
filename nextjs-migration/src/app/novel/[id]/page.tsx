import { RouteShell } from "@/app/_components/RouteShell";

interface NovelPageProps {
  params: Promise<{ id: string }>;
}

export default async function NovelPage({ params }: NovelPageProps) {
  const { id } = await params;

  return (
    <RouteShell
      title="소설 상세"
      description="기존 /novel/:id 경로를 Next.js 동적 라우트로 옮길 자리입니다."
      source="src/pages/Novel.page.tsx"
      params={{ id }}
    />
  );
}
