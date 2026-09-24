import { activeMusicIds } from "./activeMusic";
import type { LyricLine, LyricTrack } from "@appTypes/lyric";
import { db } from "@/server/db";
import { cacheLife, cacheTag } from "next/cache";
import { PUBLIC_CATALOG_CACHE_TAG } from "./publicCatalog";

export const getLyricTrackByMusicId = async (
  musicId: number,
): Promise<LyricTrack | null> => {
  "use cache";
  cacheTag(PUBLIC_CATALOG_CACHE_TAG);
  cacheLife("hours");

  const track = await db.query.lyricTracks.findFirst({
    where: (lyricTracks, { and, eq, inArray }) => and(eq(lyricTracks.musicId, musicId), inArray(lyricTracks.musicId, activeMusicIds())),
  });

  if (!track) return null;

  return {
    id: track.musicId,
    sync: track.sync,
    lyric: track.lyricJson as LyricLine[],
  };
};
