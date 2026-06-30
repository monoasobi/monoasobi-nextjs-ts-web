import { RouteShell } from "@/app/_components/RouteShell";

export default function PlayersPage() {
  return (
    <RouteShell
      title="Players"
      description="기존 /players 특수 페이지를 옮길 자리입니다."
      source="src/pages/Players.page.tsx"
    />
  );
}
