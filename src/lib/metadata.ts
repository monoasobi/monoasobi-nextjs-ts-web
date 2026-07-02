import type { Metadata } from "next";

const SITE_NAME = "monoasobi";
const SITE_TITLE = "MONOASOBI";
const SITE_URL = "https://monoasobi.vercel.app";
const SITE_DOMAIN = "monoasobi.vercel.app";
const DEFAULT_DESCRIPTION = "요아소비 원작 소설 번역 제공 팬 사이트";
const DEFAULT_OG_IMAGE = "/images/opengraph.png";
export const THEME_COLOR = "#F2285A";

interface PageMetadataInput {
  title?: string;
  description?: string;
  path?: string;
}

const formatTitle = (title?: string) =>
  title ? `${title} | ${SITE_NAME}` : SITE_TITLE;

const createAbsoluteUrl = (path: string) => new URL(path, SITE_URL).toString();

export const createPageMetadata = ({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
}: PageMetadataInput = {}): Metadata => {
  const fullTitle = formatTitle(title);
  const fullUrl = createAbsoluteUrl(path);

  return {
    title: fullTitle,
    description,
    manifest: "/manifest.json",
    alternates: {
      canonical: path,
    },
    icons: {
      icon: [
        { url: "/favicon.ico" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
        { url: "/android-icon-192x192.png", sizes: "192x192", type: "image/png" },
      ],
      apple: [
        { url: "/apple-icon-57x57.png", sizes: "57x57" },
        { url: "/apple-icon-60x60.png", sizes: "60x60" },
        { url: "/apple-icon-72x72.png", sizes: "72x72" },
        { url: "/apple-icon-76x76.png", sizes: "76x76" },
        { url: "/apple-icon-114x114.png", sizes: "114x114" },
        { url: "/apple-icon-120x120.png", sizes: "120x120" },
        { url: "/apple-icon-144x144.png", sizes: "144x144" },
        { url: "/apple-icon-152x152.png", sizes: "152x152" },
        { url: "/apple-icon-180x180.png", sizes: "180x180" },
      ],
    },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          alt: SITE_TITLE,
        },
      ],
      locale: "ko_KR",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    other: {
      "msapplication-TileColor": THEME_COLOR,
      "msapplication-TileImage": "/ms-icon-144x144.png",
      "twitter:domain": SITE_DOMAIN,
      "twitter:url": fullUrl,
    },
  };
};

export const metadataBase = new URL(SITE_URL);
