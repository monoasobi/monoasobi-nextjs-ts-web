import sharp from "sharp";
import { ALBUM_ART_MAX_BYTES } from "@/lib/albumArt";

export const normalizeAlbumArt = async (input: Uint8Array) => {
  if (!input.byteLength || input.byteLength > ALBUM_ART_MAX_BYTES) {
    throw new Error("앨범아트는 3MB 이하의 이미지여야 합니다.");
  }
  const image = sharp(input, { limitInputPixels: 40_000_000 });
  const metadata = await image.metadata();
  if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format) || (metadata.pages ?? 1) > 1) {
    throw new Error("정지 이미지 JPG, PNG, WebP만 사용할 수 있습니다.");
  }
  return image.rotate().resize(1000, 1000, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90 }).toBuffer();
};
