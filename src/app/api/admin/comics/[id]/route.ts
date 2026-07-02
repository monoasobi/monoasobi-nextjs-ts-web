import {
  parseAdminPayload,
  parsePositiveId,
  requireAdminSession,
} from "@/app/api/admin/_utils";
import { deleteComic, updateComic } from "@/server/mutations/admin";
import { comicSchema } from "@/server/schemas/admin.schema";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface AdminComicRouteContext {
  params: Promise<{ id: string }>;
}

export const PUT = async (
  request: Request,
  context: AdminComicRouteContext,
) => {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const { id: rawId } = await context.params;
  const { id, response: idError } = parsePositiveId(rawId, "comic");
  if (idError) return idError;

  const { data, response: payloadError } = await parseAdminPayload(
    request,
    comicSchema,
    "comic",
  );
  if (payloadError) return payloadError;

  const comic = await updateComic(id, data);
  if (!comic) {
    return NextResponse.json({ error: "Comic not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, comic });
};

export const DELETE = async (
  _request: Request,
  context: AdminComicRouteContext,
) => {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const { id: rawId } = await context.params;
  const { id, response: idError } = parsePositiveId(rawId, "comic");
  if (idError) return idError;

  const comic = await deleteComic(id);
  if (!comic) {
    return NextResponse.json({ error: "Comic not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, comic });
};
