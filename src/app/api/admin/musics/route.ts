import {
  parseAdminPayload,
  requireAdminSession,
} from "@/app/api/admin/_utils";
import { createMusic } from "@/server/mutations/admin";
import { musicSchema } from "@/server/schemas/admin.schema";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export const POST = async (request: Request) => {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const { data, response } = await parseAdminPayload(
    request,
    musicSchema,
    "music",
  );
  if (response) return response;

  const music = await createMusic(data);
  return NextResponse.json({ ok: true, music }, { status: 201 });
};
