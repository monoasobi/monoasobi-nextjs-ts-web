import Link from "next/link";
import styles from "./route-shell.module.css";

interface RouteShellProps {
  title: string;
  description: string;
  source: string;
  params?: Record<string, string>;
}

export const RouteShell = ({
  title,
  description,
  source,
  params,
}: RouteShellProps) => {
  const entries = Object.entries(params ?? {});

  return (
    <main className={styles.shell}>
      <section className={styles.panel}>
        <p className={styles.eyebrow}>Next.js route shell</p>
        <h1>{title}</h1>
        <p className={styles.description}>{description}</p>
        <dl className={styles.meta}>
          <div>
            <dt>기존 구현</dt>
            <dd>{source}</dd>
          </div>
          {entries.map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <nav className={styles.links} aria-label="Migration routes">
          <Link href="/">홈</Link>
          <Link href="/novel/0">소설 예시</Link>
          <Link href="/comic/0">만화 예시</Link>
          <Link href="/guide">가이드</Link>
        </nav>
      </section>
    </main>
  );
};
