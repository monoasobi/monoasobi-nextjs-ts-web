import {
  parseAdminPayload,
  requireAdminWriteAccess,
} from "@/app/api/admin/_utils";
import { createBook } from "@/server/mutations/admin";
import { bookSchema } from "@/server/schemas/admin.schema";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export const POST = async (request: Request) => {
  const unauthorized = await requireAdminWriteAccess();
  if (unauthorized) return unauthorized;

  const { data, response } = await parseAdminPayload(
    request,
    bookSchema,
    "book",
  );
  if (response) return response;

  const book = await createBook(data);
  return NextResponse.json({ ok: true, book }, { status: 201 });
};
