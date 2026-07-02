import { requireAgentAuth } from "@/app/api/agent/_utils";
import { getAgentCatalog } from "@/server/queries/agent";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export const GET = async (request: Request) => {
  const unauthorized = requireAgentAuth(request);
  if (unauthorized) return unauthorized;

  const catalog = await getAgentCatalog();

  return NextResponse.json(catalog);
};
