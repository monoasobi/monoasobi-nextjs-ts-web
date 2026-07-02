import {
  parseAdminPayload,
  parsePositiveId,
  requireAdminSession,
} from "@/app/api/admin/_utils";
import { deleteMusic, updateMusic } from "@/server/mutations/admin";
import { musicSchema } from "@/server/schemas/admin.schema";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface AdminMusicRouteContext {
  params: Promise<{ id: string }>;
}

export const PUT = async (
  request: Request,
  context: AdminMusicRouteContext,
) => {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const { id: rawId } = await context.params;
  const { id, response: idError } = parsePositiveId(rawId, "music");
  if (idError) return idError;

  const { data, response: payloadError } = await parseAdminPayload(
    request,
    musicSchema,
    "music",
  );
  if (payloadError) return payloadError;

  const updated = await updateMusic(id, data);
  if (!updated) {
    return NextResponse.json({ error: "Music not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, music: updated });
};

export const DELETE = async (
  _request: Request,
  context: AdminMusicRouteContext,
) => {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const { id: rawId } = await context.params;
  const { id, response: idError } = parsePositiveId(rawId, "music");
  if (idError) return idError;

  const deleted = await deleteMusic(id);
  if (!deleted) {
    return NextResponse.json({ error: "Music not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, music: deleted });
};
