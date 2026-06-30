import type { LyricTrack } from "@appTypes/lyric";

export const loadLyricTrack = async (
  musicId: number,
): Promise<LyricTrack | null> => {
  const response = await fetch(`/lyrics/${musicId}.json`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Failed to load lyric track");

  return response.json() as Promise<LyricTrack>;
};
