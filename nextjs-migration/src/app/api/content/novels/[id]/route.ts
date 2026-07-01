import { getR2Object, r2BodyToResponseBody } from "@/server/storage";
import {
  PRIVATE_READER_COOKIE_NAME,
  verifyPrivateReaderSession,
} from "@/server/auth/private-reader";
import { getNovelContentAccess } from "@/server/queries/novel";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface NovelRouteContext {
  params: Promise<{ id: string }>;
}

export const GET = async (request: Request, context: NovelRouteContext) => {
  const { id } = await context.params;
  const novelId = Number(id);

  if (!Number.isInteger(novelId)) {
    return new Response("Invalid novel id", { status: 400 });
  }

  const novel = await getNovelContentAccess(novelId);
  if (!novel) return new Response("Novel not found", { status: 404 });

  const cookieHeader = request.headers.get("cookie") ?? "";
  const privateReaderSession = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${PRIVATE_READER_COOKIE_NAME}=`))
    ?.split("=")[1];

  if (
    novel?.isPublished &&
    !verifyPrivateReaderSession(privateReaderSession)
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const object = await getR2Object(novel.contentKey);
    if (!object) return new Response("File not found", { status: 404 });

    const body = await r2BodyToResponseBody(object.Body);
    if (!body) return new Response("File not found", { status: 404 });

    const headers = new Headers({
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    });

    if (object.ETag) headers.set("ETag", object.ETag);

    return new Response(body, { headers });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: "Unknown R2 error" }, { status: 500 });
  }
};
