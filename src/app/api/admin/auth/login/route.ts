import {
  ADMIN_COOKIE_NAME,
  createAdminSession,
  getAdminCookieOptions,
  verifyAdminPassword,
} from "@/server/auth/admin";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export const POST = async (request: Request) => {
  const body = (await request.json().catch(() => null)) as {
    password?: unknown;
  } | null;
  const password = typeof body?.password === "string" ? body.password : "";

  try {
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set(
      ADMIN_COOKIE_NAME,
      createAdminSession(),
      getAdminCookieOptions(),
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown admin auth error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
};
