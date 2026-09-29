import { parseNonNegativeId, requireAdminWriteAccess, revalidatePublicCatalog } from "@/app/api/admin/_utils";
import { ALBUM_ART_MAX_BYTES } from "@/lib/albumArt";
import { normalizeAlbumArt } from "@/server/albumArtImage";
import { saveAlbumArt } from "@/server/mutations/albumArt";

export const PUT = async (request: Request, context: { params: Promise<{ id: string }> }) => {
  const unauthorized = await requireAdminWriteAccess();
  if (unauthorized) return unauthorized;
  const { id, response } = parseNonNegativeId((await context.params).id, "music");
  if (response) return response;
  if (Number(request.headers.get("content-length")) > ALBUM_ART_MAX_BYTES) {
    return Response.json({ error: "앨범아트는 3MB 이하여야 합니다." }, { status: 413 });
  }
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ error: "이미지를 선택해주세요." }, { status: 400 });
  let image: Uint8Array;
  try {
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > ALBUM_ART_MAX_BYTES) {
        await reader.cancel();
        return Response.json({ error: "앨범아트는 3MB 이하여야 합니다." }, { status: 413 });
      }
      chunks.push(value);
    }
    image = await normalizeAlbumArt(Buffer.concat(chunks));
  } catch {
    return Response.json({ error: "3MB 이하의 올바른 JPG, PNG, WebP 정지 이미지를 선택해주세요." }, { status: 400 });
  }
  try {
    const key = await saveAlbumArt(id, image);
    if (!key) return Response.json({ error: "곡을 찾을 수 없습니다." }, { status: 404 });
    revalidatePublicCatalog();
    return Response.json({ ok: true, albumArtKey: key });
  } catch {
    return Response.json({ error: "앨범아트 저장에 실패했습니다. 다시 시도해주세요." }, { status: 500 });
  }
};
