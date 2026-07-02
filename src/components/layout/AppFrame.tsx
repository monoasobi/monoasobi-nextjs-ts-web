import { Header } from "@components/layout/Header";
import { Sidebar } from "@components/layout/Sidebar";
import styles from "./AppFrame.module.css";

interface AppFrameProps {
  children: React.ReactNode;
}

export const AppFrame = ({ children }: AppFrameProps) => {
  return (
    <div className={styles.frame}>
      <Header />
      <div className={styles.body}>
        <Sidebar />
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
};
