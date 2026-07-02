import type { Metadata, Viewport } from "next";
import "@radix-ui/themes/styles.css";
import "./globals.css";
import { AppFrame } from "@components/layout/AppFrame";
import { createPageMetadata, metadataBase, THEME_COLOR } from "@lib/metadata";
import { Providers } from "./providers";

export const metadata: Metadata = {
  ...createPageMetadata(),
  metadataBase,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: THEME_COLOR,
};

export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <Providers>
          <AppFrame>{children}</AppFrame>
        </Providers>
      </body>
    </html>
  );
}
