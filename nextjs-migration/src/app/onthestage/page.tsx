import { RouteShell } from "@/app/_components/RouteShell";

export default function OnTheStagePage() {
  return (
    <RouteShell
      title="On The Stage"
      description="기존 /onthestage 특수 페이지를 옮길 자리입니다."
      source="src/pages/OnTheStage.page.tsx"
    />
  );
}
