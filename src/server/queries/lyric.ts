import type { LyricLine, LyricTrack } from "@appTypes/lyric";
import { db } from "@/server/db";

export const getLyricTrackByMusicId = async (
  musicId: number,
): Promise<LyricTrack | null> => {
  const track = await db.query.lyricTracks.findFirst({
    where: (lyricTracks, { eq }) => eq(lyricTracks.musicId, musicId),
  });

  if (!track) return null;

  return {
    id: track.musicId,
    sync: track.sync,
    lyric: track.lyricJson as LyricLine[],
  };
};
