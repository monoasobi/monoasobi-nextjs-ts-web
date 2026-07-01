import type { Metadata } from "next";
import "@radix-ui/themes/styles.css";
import "./globals.css";
import { AppFrame } from "@components/layout/AppFrame";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "monoasobi",
  description: "YOASOBI 원작 소설과 번역을 모아 읽는 공간",
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
