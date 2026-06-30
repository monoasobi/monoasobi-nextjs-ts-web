import { RouteShell } from "@/app/_components/RouteShell";

export default function HeartBeatPage() {
  return (
    <RouteShell
      title="Heart Beat"
      description="기존 /heartbeat 특수 페이지를 옮길 자리입니다."
      source="src/pages/HeartBeat.page.tsx"
    />
  );
}
