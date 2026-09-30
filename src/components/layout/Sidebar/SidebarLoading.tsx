"use client";

import { Loading } from "@/components/feedback/Loading";
import { useHydrated } from "@/hooks/useHydrated";
import { sidebarAtom } from "@atoms/sidebar.atom";
import { useAtom } from "jotai";
import styles from "../Sidebar.module.css";

// Suspense fallback must not read dynamic route parameters or pathname.
export const SidebarLoading = () => {
  const [isSidebar, setIsSidebar] = useAtom(sidebarAtom);
  const isHydrated = useHydrated();
  const isOpen = isHydrated && isSidebar;

  return (
    <>
      <button
        type="button"
        className={styles.overlay}
        data-open={isOpen}
        aria-label="사이드바 닫기"
        aria-hidden={!isOpen}
        tabIndex={isOpen ? 0 : -1}
        onClick={() => setIsSidebar(false)}
      />
      <aside className={styles.container} data-open={isOpen}>
        <Loading label="목록을 불러오는 중입니다." />
      </aside>
    </>
  );
};
