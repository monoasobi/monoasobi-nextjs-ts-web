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
      "twitter:domain": SITE_DOMAIN,
      "twitter:url": fullUrl,
    },
  };
};

export const metadataBase = new URL(SITE_URL);
