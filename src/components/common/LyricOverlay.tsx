import type { LyricLine } from "@appTypes/lyric";

interface LyricOverlayProps {
  line: LyricLine | null;
  showJp: boolean;
  showReading: boolean;
  classes: { jp: string; reading: string; kr: string };
}

export const LyricOverlay = ({
  line,
  showJp,
  showReading,
  classes,
}: LyricOverlayProps) => {
  if (!line) return null;
  return (
    <>
      {showJp && line.jp && <p className={classes.jp}>{line.jp}</p>}
      {showReading && line.jpReading && (
        <p className={classes.reading}>{line.jpReading}</p>
      )}
      {line.kr && <p className={classes.kr}>{line.kr}</p>}
    </>
  );
};
