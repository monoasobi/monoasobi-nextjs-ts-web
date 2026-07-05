import {
  parseAdminPayload,
  requireAdminWriteAccess,
  revalidatePublicCatalog,
} from "@/app/api/admin/_utils";
import { createLyricTrack } from "@/server/mutations/admin";
import { lyricTrackSchema } from "@/server/schemas/admin.schema";
import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
  const unauthorized = await requireAdminWriteAccess();
  if (unauthorized) return unauthorized;

  const { data, response } = await parseAdminPayload(
    request,
    lyricTrackSchema,
    "lyricTrack",
  );
  if (response) return response;

  const lyricTrack = await createLyricTrack(data);
  revalidatePublicCatalog();

  return NextResponse.json({ ok: true, lyricTrack }, { status: 201 });
};
