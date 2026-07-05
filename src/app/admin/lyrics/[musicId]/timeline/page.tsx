import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/server/auth/admin";
import { getAdminLyricTimeline } from "@/server/queries/admin";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { Callout, Heading, IconButton, Text } from "@radix-ui/themes";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminLogin } from "../../../_components/AdminLogin";
import { LyricTimelineEditor } from "../../../_components/lyric-timeline/LyricTimelineEditor";
import styles from "./page.module.css";

interface AdminLyricTimelinePageProps {
  params: Promise<{ musicId: string }>;
}

export default function AdminLyricTimelinePage(
  props: AdminLyricTimelinePageProps,
) {
  return (
    <Suspense fallback={null}>
      <AdminLyricTimelinePageContent {...props} />
    </Suspense>
  );
}

async function AdminLyricTimelinePageContent({
  params,
}: AdminLyricTimelinePageProps) {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const adminSession = verifyAdminSession(session);

  if (!adminSession.authenticated) {
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
          <IconButton
            asChild
            className={styles.backButton}
            size="1"
            variant="ghost"
            color="gray"
          >
            <Link href="/admin" aria-label="Admin으로 돌아가기">
              <ChevronLeftIcon width="18" height="18" />
            </Link>
          </IconButton>
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
              이 곡의 lyricTrack이 아직 없습니다. `/admin`에서 lyricTrack을 먼저
              생성해주세요.
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
          <LyricTimelineEditor
            music={music}
            lyricTrack={lyricTrack}
            role={adminSession.role}
          />
        )}
      </section>
    </main>
  );
}
