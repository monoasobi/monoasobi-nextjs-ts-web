import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/server/auth/admin";
import { getAdminLyricTimeline } from "@/server/queries/admin";
import {
  Button,
  Callout,
  Heading,
  Text,
} from "@radix-ui/themes";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminLogin } from "../../../_components/AdminLogin";
import { LyricTimelineEditor } from "../../../_components/lyric-timeline/LyricTimelineEditor";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

interface AdminLyricTimelinePageProps {
  params: Promise<{ musicId: string }>;
}

export default async function AdminLyricTimelinePage({
  params,
}: AdminLyricTimelinePageProps) {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!verifyAdminSession(session)) {
    return <AdminLogin />;
  }

  const { musicId: rawMusicId } = await params;
  const musicId = Number(rawMusicId);

  if (!Number.isInteger(musicId) || musicId < 0) {
    notFound();
  }

  const data = await getAdminLyricTimeline(musicId);
  if (!data) notFound();

  const { music, lyricTrack } = data;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <Button asChild size="1" variant="ghost" color="gray">
            <Link href="/admin">Admin으로 돌아가기</Link>
          </Button>
          <div className={styles.titleRow}>
            <Heading size="5">{music.title}</Heading>
            <Text size="2" color="gray">
              {music.korTitle} / {music.enTitle}
            </Text>
          </div>
        </div>
      </header>

      <section className={styles.content}>
        {!lyricTrack && (
          <Callout.Root className={styles.status} color="amber" variant="soft">
            <Callout.Text>
              이 곡의 lyricTrack이 아직 없습니다. `/admin`에서 lyricTrack을
              먼저 생성해주세요.
            </Callout.Text>
          </Callout.Root>
        )}

        {lyricTrack && !music.youtubeId && (
          <Callout.Root className={styles.status} color="amber" variant="soft">
            <Callout.Text>
              등록된 YouTube 영상이 없어 Timeline 편집기를 열 수 없습니다.
            </Callout.Text>
          </Callout.Root>
        )}

        {lyricTrack && music.youtubeId && (
          <LyricTimelineEditor music={music} lyricTrack={lyricTrack} />
        )}
      </section>
    </main>
  );
}
