import type { LyricLine } from "@appTypes/lyric";

// English is shared storage for loudasobi, not a MONOASOBI display/edit field.
export function withoutEnglish(line: LyricLine): LyricLine {
  const result = { ...line };
  delete result.en;
  delete result.enReading;
  return result;
}

export function preserveEnglish(incoming: LyricLine[], stored: LyricLine[]): LyricLine[] {
  const byId = new Map(stored.filter(line => line.id).map(line => [line.id, line]));
  return incoming.map(line => {
    const next = withoutEnglish(line);
    const previous = line.id ? byId.get(line.id) : undefined;
    if (previous?.en !== undefined) next.en = previous.en;
    if (previous?.enReading !== undefined) next.enReading = previous.enReading;
    return next;
  });
}
