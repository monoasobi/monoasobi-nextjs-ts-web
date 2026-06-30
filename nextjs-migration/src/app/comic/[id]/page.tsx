import { RouteShell } from "@/app/_components/RouteShell";

interface ComicPageProps {
  params: Promise<{ id: string }>;
}

export default async function ComicPage({ params }: ComicPageProps) {
  const { id } = await params;

  return (
    <RouteShell
      title="만화 상세"
      description="기존 /comic/:id 경로를 Next.js 동적 라우트로 옮길 자리입니다."
      source="src/pages/Comic.page.tsx"
      params={{ id }}
    />
  );
}
