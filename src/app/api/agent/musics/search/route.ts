import { requireAgentAuth } from "@/app/api/agent/_utils";
import { searchAgentMusics } from "@/server/queries/agent";
import { NextResponse } from "next/server";

export const GET = async (request: Request) => {
  const unauthorized = requireAgentAuth(request);
  if (unauthorized) return unauthorized;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const musics = await searchAgentMusics(query);

  return NextResponse.json(musics);
};
