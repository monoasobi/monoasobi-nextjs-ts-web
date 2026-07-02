import { verifyAgentRequest } from "@/server/auth/agent";
import { NextResponse } from "next/server";

export const requireAgentAuth = (request: Request) => {
  const auth = verifyAgentRequest(request);
  if (auth.ok) return null;

  return NextResponse.json(
    {
      error:
        auth.status === 503
          ? "Agent API token is not configured"
          : "Unauthorized",
    },
    { status: auth.status },
  );
};
