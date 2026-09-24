export type CallType = "LOUD" | "CLAP" | "CUSTOM";

export interface LyricLine {
  id?: string;
  en?: string;
  enReading?: string;
  start: number;
  end: number;
  jp: string;
  kr: string;
  jpReading: string;
  callType?: CallType;
  callGuide?: string;
}

export interface LyricTrack {
  id: number;
  sync: number;
  lyric: LyricLine[];
}
