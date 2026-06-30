import { RouteShell } from "@/app/_components/RouteShell";

export default function PrivateReaderPage() {
  return (
    <RouteShell
      title="Private Reader"
      description="기존 /admin 제한 콘텐츠 열람 권한 화면을 재명명해 옮길 자리입니다."
      source="src/pages/Admin.page.tsx"
    />
  );
}
