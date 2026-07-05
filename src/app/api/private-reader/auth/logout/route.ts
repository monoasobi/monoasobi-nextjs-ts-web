import { PRIVATE_READER_COOKIE_NAME } from "@/server/auth/private-reader";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const POST = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(PRIVATE_READER_COOKIE_NAME);

  return NextResponse.json({ ok: true });
};
