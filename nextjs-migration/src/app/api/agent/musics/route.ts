import { requireAgentAuth } from "@/app/api/agent/_utils";
import { getAgentMusics } from "@/server/queries/agent";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export const GET = async (request: Request) => {
  const unauthorized = requireAgentAuth(request);
  if (unauthorized) return unauthorized;

  const musics = await getAgentMusics();

  return NextResponse.json(musics);
};
