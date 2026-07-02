import { getR2Object, r2BodyToResponseBody } from "@/server/storage";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface ComicFileRouteContext {
  params: Promise<{ key: string[] }>;
}

export const GET = async (_request: Request, context: ComicFileRouteContext) => {
  const { key } = await context.params;
  const objectKey = decodeURIComponent(key.join("/"));

  try {
    const object = await getR2Object(objectKey);
    if (!object) return new Response("File not found", { status: 404 });

    const body = await r2BodyToResponseBody(object.Body);
    if (!body) return new Response("File not found", { status: 404 });

    const headers = new Headers({
      "Cache-Control": "public, max-age=86400",
    });

    if (object.ContentType) headers.set("Content-Type", object.ContentType);
    if (object.ETag) headers.set("ETag", object.ETag);

    return new Response(body, { headers });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: "Unknown R2 error" }, { status: 500 });
  }
};
