"use client";

import Image from "next/image";
import { useState } from "react";
import { EMPTY_ALBUM_ART } from "@/lib/albumArt";

export const AlbumArtwork = ({ src, alt, size = 72, className, fit = "cover" }: {
  src: string; alt: string; size?: number; className?: string; fit?: "cover" | "contain";
}) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc === src;
  return <Image src={failed ? EMPTY_ALBUM_ART : src} alt={alt} width={size} height={size}
    className={className} style={{ objectFit: fit }} unoptimized={src.startsWith("blob:")}
    onError={failed ? undefined : () => setFailedSrc(src)} />;
};
