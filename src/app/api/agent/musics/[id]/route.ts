import { requireAgentAuth } from "@/app/api/agent/_utils";
import { getAgentMusicById } from "@/server/queries/agent";
import { NextResponse } from "next/server";

interface AgentMusicRouteContext {
  params: Promise<{ id: string }>;
}

export const GET = async (
  request: Request,
  context: AgentMusicRouteContext,
) => {
  const unauthorized = requireAgentAuth(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const musicId = Number(id);

  if (!Number.isInteger(musicId)) {
    return NextResponse.json({ error: "Invalid music id" }, { status: 400 });
  }

  const music = await getAgentMusicById(musicId);
  if (!music) {
    return NextResponse.json({ error: "Music not found" }, { status: 404 });
  }

  return NextResponse.json(music);
};
