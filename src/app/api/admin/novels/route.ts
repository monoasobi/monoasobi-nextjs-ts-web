import {
  parseAdminPayload,
  requireAdminWriteAccess,
} from "@/app/api/admin/_utils";
import { createNovel } from "@/server/mutations/admin";
import { novelSchema } from "@/server/schemas/admin.schema";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export const POST = async (request: Request) => {
  const unauthorized = await requireAdminWriteAccess();
  if (unauthorized) return unauthorized;

  const { data, response } = await parseAdminPayload(
    request,
    novelSchema,
    "novel",
  );
  if (response) return response;

  const novel = await createNovel(data);
  return NextResponse.json({ ok: true, novel }, { status: 201 });
};
