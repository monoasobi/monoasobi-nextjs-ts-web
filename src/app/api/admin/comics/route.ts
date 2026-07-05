import {
  parseAdminPayload,
  requireAdminWriteAccess,
  revalidatePublicCatalog,
} from "@/app/api/admin/_utils";
import { createComic } from "@/server/mutations/admin";
import { comicSchema } from "@/server/schemas/admin.schema";
import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
  const unauthorized = await requireAdminWriteAccess();
  if (unauthorized) return unauthorized;

  const { data, response } = await parseAdminPayload(
    request,
    comicSchema,
    "comic",
  );
  if (response) return response;

  const comic = await createComic(data);
  revalidatePublicCatalog();

  return NextResponse.json({ ok: true, comic }, { status: 201 });
};
