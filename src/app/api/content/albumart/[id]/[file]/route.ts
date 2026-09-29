import { getMusicById } from "@/server/queries/music";
import { getR2Object, r2BodyToResponseBody } from "@/server/storage";

export const GET = async (_request: Request, context: { params: Promise<{ id: string; file: string }> }) => {
  const { id, file } = await context.params;
  if (!/^\d+$/.test(id) || !/^[a-f0-9-]+\.webp$/.test(file)) return new Response(null, { status: 404 });
  const key = `albumart/${id}/${file}`;
  const music = await getMusicById(Number(id));
  if (!music || music.albumArtKey !== key) return new Response(null, { status: 404 });
  try {
    const object = await getR2Object(key);
    if (!object?.Body) return new Response(null, { status: 404 });
    return new Response(await r2BodyToResponseBody(object.Body), { headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch {
    return new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
};
