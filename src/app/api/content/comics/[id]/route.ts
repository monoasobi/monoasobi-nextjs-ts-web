import { getComicById } from "@/server/queries/comic";
import { listR2ObjectKeys } from "@/server/storage";
import { NextResponse } from "next/server";

interface ComicRouteContext {
  params: Promise<{ id: string }>;
}

export const GET = async (request: Request, context: ComicRouteContext) => {
  const { id } = await context.params;

  const comicId = Number(id);
  if (!Number.isInteger(comicId) || comicId < 0 || !(await getComicById(comicId))) {
    return new Response("Comic not found", { status: 404 });
  }

  try {
    const keys = await listR2ObjectKeys(`comics/${id}/`);

    if (keys.length === 0) {
      return new Response("No files found", { status: 404 });
    }

    const url = new URL(request.url);
    const urls = keys.map((key) => {
      const encoded = encodeURIComponent(key);
      return `${url.origin}/api/content/comic-file/${encoded}`;
    });

    return NextResponse.json(urls, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: "Unknown R2 error" }, { status: 500 });
  }
};
