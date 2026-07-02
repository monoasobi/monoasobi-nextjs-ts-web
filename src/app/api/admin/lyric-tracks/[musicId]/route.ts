import {
  parseAdminPayload,
  parseNonNegativeId,
  requireAdminSession,
} from "@/app/api/admin/_utils";
import {
  deleteLyricTrack,
  updateLyricTrack,
} from "@/server/mutations/admin";
import { lyricTrackSchema } from "@/server/schemas/admin.schema";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface AdminLyricTrackRouteContext {
  params: Promise<{ musicId: string }>;
}

export const PUT = async (
  request: Request,
  context: AdminLyricTrackRouteContext,
) => {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const { musicId: rawMusicId } = await context.params;
  const { id: musicId, response: idError } = parseNonNegativeId(
    rawMusicId,
    "music",
  );
  if (idError) return idError;

  const { data, response: payloadError } = await parseAdminPayload(
    request,
    lyricTrackSchema,
    "lyricTrack",
  );
  if (payloadError) return payloadError;

  const lyricTrack = await updateLyricTrack(musicId, data);
  if (!lyricTrack) {
    return NextResponse.json(
      { error: "Lyric track not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, lyricTrack });
};

export const DELETE = async (
  _request: Request,
  context: AdminLyricTrackRouteContext,
) => {
  const unauthorized = await requireAdminSession();
  if (unauthorized) return unauthorized;

  const { musicId: rawMusicId } = await context.params;
  const { id: musicId, response: idError } = parseNonNegativeId(
    rawMusicId,
    "music",
  );
  if (idError) return idError;

  const lyricTrack = await deleteLyricTrack(musicId);
  if (!lyricTrack) {
    return NextResponse.json(
      { error: "Lyric track not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, lyricTrack });
};
