import {
  parseAdminPayload,
  parsePositiveId,
  requireAdminWriteAccess,
} from "@/app/api/admin/_utils";
import { deleteBook, updateBook } from "@/server/mutations/admin";
import { bookSchema } from "@/server/schemas/admin.schema";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface AdminBookRouteContext {
  params: Promise<{ id: string }>;
}

export const PUT = async (
  request: Request,
  context: AdminBookRouteContext,
) => {
  const unauthorized = await requireAdminWriteAccess();
  if (unauthorized) return unauthorized;

  const { id: rawId } = await context.params;
  const { id, response: idError } = parsePositiveId(rawId, "book");
  if (idError) return idError;

  const { data, response: payloadError } = await parseAdminPayload(
    request,
    bookSchema,
    "book",
  );
  if (payloadError) return payloadError;

  const book = await updateBook(id, data);
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, book });
};

export const DELETE = async (
  _request: Request,
  context: AdminBookRouteContext,
) => {
  const unauthorized = await requireAdminWriteAccess();
  if (unauthorized) return unauthorized;

  const { id: rawId } = await context.params;
  const { id, response: idError } = parsePositiveId(rawId, "book");
  if (idError) return idError;

  const book = await deleteBook(id);
  if (!book) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, book });
};
