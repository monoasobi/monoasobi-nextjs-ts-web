import {
  PRIVATE_READER_COOKIE_NAME,
  verifyPrivateReaderSession,
} from "@/server/auth/private-reader";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export const GET = async () => {
  const cookieStore = await cookies();
  const session = cookieStore.get(PRIVATE_READER_COOKIE_NAME)?.value;

  return NextResponse.json({
    authenticated: verifyPrivateReaderSession(session),
  });
};
