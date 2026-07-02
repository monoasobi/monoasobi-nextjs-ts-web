"use client";

import { appearanceAtom } from "@atoms/appearance.atom";
import { privateReaderAtom } from "@atoms/privateReader.atom";
import { sidebarAtom } from "@atoms/sidebar.atom";
import { Theme } from "@radix-ui/themes";
import { Analytics } from "@vercel/analytics/next";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  const appearance = useAtomValue(appearanceAtom);
  const setIsSidebar = useSetAtom(sidebarAtom);
  const setHasPrivateReaderAccess = useSetAtom(privateReaderAtom);

  useEffect(() => {
    const width = window.innerWidth;
    if (width < 1024) setIsSidebar(false);
  }, [setIsSidebar]);

  useEffect(() => {
    const syncPrivateReaderSession = async () => {
      try {
        const response = await fetch("/api/private-reader/auth/session");
        if (!response.ok) return;

        const data = (await response.json()) as { authenticated?: boolean };
        setHasPrivateReaderAccess(Boolean(data.authenticated));
      } catch {
        setHasPrivateReaderAccess(false);
      }
    };

    void syncPrivateReaderSession();
  }, [setHasPrivateReaderAccess]);

  return (
    <Theme
      appearance={appearance}
      accentColor="red"
      panelBackground="solid"
      radius="small"
    >
      {children}
      <Analytics />
    </Theme>
  );
};
