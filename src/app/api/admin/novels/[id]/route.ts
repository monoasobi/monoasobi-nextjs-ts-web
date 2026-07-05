import {
  parseAdminPayload,
  parsePositiveId,
  requireAdminWriteAccess,
  revalidatePublicCatalog,
} from "@/app/api/admin/_utils";
import { deleteNovel, updateNovel } from "@/server/mutations/admin";
import { novelSchema } from "@/server/schemas/admin.schema";
import { NextResponse } from "next/server";

interface AdminNovelRouteContext {
  params: Promise<{ id: string }>;
}

export const PUT = async (
  request: Request,
  context: AdminNovelRouteContext,
) => {
  const unauthorized = await requireAdminWriteAccess();
  if (unauthorized) return unauthorized;

  const { id: rawId } = await context.params;
  const { id, response: idError } = parsePositiveId(rawId, "novel");
  if (idError) return idError;

  const { data, response: payloadError } = await parseAdminPayload(
    request,
    novelSchema,
    "novel",
  );
  if (payloadError) return payloadError;

  const novel = await updateNovel(id, data);
  if (!novel) {
    return NextResponse.json({ error: "Novel not found" }, { status: 404 });
  }

  revalidatePublicCatalog();

  return NextResponse.json({ ok: true, novel });
};

export const DELETE = async (
  _request: Request,
  context: AdminNovelRouteContext,
) => {
  const unauthorized = await requireAdminWriteAccess();
  if (unauthorized) return unauthorized;

  const { id: rawId } = await context.params;
  const { id, response: idError } = parsePositiveId(rawId, "novel");
  if (idError) return idError;

  const novel = await deleteNovel(id);
  if (!novel) {
    return NextResponse.json({ error: "Novel not found" }, { status: 404 });
  }

  revalidatePublicCatalog();

  return NextResponse.json({ ok: true, novel });
};
