import { timingSafeEqual } from "node:crypto";

const getBearerToken = (authorization: string | null) => {
  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
};

const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) return false;

  return timingSafeEqual(leftBuffer, rightBuffer);
};

export const verifyAgentRequest = (request: Request) => {
  const token = getBearerToken(request.headers.get("authorization"));
  if (!token) return { ok: false, status: 401 } as const;

  const expectedToken = process.env.AGENT_API_TOKEN;
  if (!expectedToken) return { ok: false, status: 503 } as const;

  return safeEqual(token, expectedToken)
    ? ({ ok: true } as const)
    : ({ ok: false, status: 401 } as const);
};
