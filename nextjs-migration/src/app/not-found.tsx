import Link from "next/link";
import styles from "./_components/route-shell.module.css";

export default function NotFound() {
  return (
    <main className={styles.shell}>
      <section className={styles.panel}>
        <p className={styles.eyebrow}>404</p>
        <h1>페이지를 찾을 수 없습니다</h1>
        <p className={styles.description}>
          기존 NotFound 화면을 옮기기 전의 App Router fallback입니다.
        </p>
        <nav className={styles.links} aria-label="Not found navigation">
          <Link href="/">홈으로 이동</Link>
        </nav>
      </section>
    </main>
  );
}
