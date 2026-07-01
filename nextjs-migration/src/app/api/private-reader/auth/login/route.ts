import {
  createPrivateReaderSession,
  getPrivateReaderCookieOptions,
  PRIVATE_READER_COOKIE_NAME,
  verifyPrivateReaderPassword,
} from "@/server/auth/private-reader";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export const POST = async (request: Request) => {
  const body = (await request.json().catch(() => null)) as {
    password?: unknown;
  } | null;
  const password = typeof body?.password === "string" ? body.password : "";

  try {
    if (!verifyPrivateReaderPassword(password)) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set(
      PRIVATE_READER_COOKIE_NAME,
      createPrivateReaderSession(),
      getPrivateReaderCookieOptions(),
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown private-reader error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
};
