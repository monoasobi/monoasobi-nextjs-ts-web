import { ADMIN_COOKIE_NAME } from "@/server/auth/admin";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export const POST = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);

  return NextResponse.json({ ok: true });
};
