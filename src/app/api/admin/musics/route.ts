import {
  parseAdminPayload,
  requireAdminWriteAccess,
  revalidatePublicCatalog,
} from "@/app/api/admin/_utils";
import { createMusic } from "@/server/mutations/admin";
import { musicSchema } from "@/server/schemas/admin.schema";
import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
  const unauthorized = await requireAdminWriteAccess();
  if (unauthorized) return unauthorized;

  const { data, response } = await parseAdminPayload(
    request,
    musicSchema,
    "music",
  );
  if (response) return response;

  const music = await createMusic(data);
  revalidatePublicCatalog();

  return NextResponse.json({ ok: true, music }, { status: 201 });
};
