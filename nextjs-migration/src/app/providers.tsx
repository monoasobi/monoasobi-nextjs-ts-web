"use client";

import { appearanceAtom } from "@atoms/appearance.atom";
import { sidebarAtom } from "@atoms/sidebar.atom";
import { Theme } from "@radix-ui/themes";
import { Analytics } from "@vercel/analytics/react";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  const appearance = useAtomValue(appearanceAtom);
  const setIsSidebar = useSetAtom(sidebarAtom);

  useEffect(() => {
    const width = window.innerWidth;
    if (width < 1024) setIsSidebar(false);
  }, [setIsSidebar]);

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
