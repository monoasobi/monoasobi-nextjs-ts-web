export const ALBUM_ART_MAX_BYTES = 3 * 1024 * 1024;
export const ALBUM_ART_ACCEPT = "image/jpeg,image/png,image/webp";
export const EMPTY_ALBUM_ART = "/images/albumart/empty.svg";

export const getAlbumArtSrc = (music: { id: number; albumArtKey?: string | null }) =>
  music.albumArtKey
    ? `/api/content/${music.albumArtKey}`
    : `/images/albumart/${music.id}.webp`;
