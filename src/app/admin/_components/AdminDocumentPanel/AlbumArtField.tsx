"use client";

import { useEffect, useState } from "react";
import { Flex, Text } from "@radix-ui/themes";
import { AlbumArtwork } from "@/components/common/AlbumArtwork";
import { ALBUM_ART_ACCEPT, ALBUM_ART_MAX_BYTES, EMPTY_ALBUM_ART } from "@/lib/albumArt";

export const AlbumArtField = ({ currentSrc = EMPTY_ALBUM_ART, disabled }: { currentSrc?: string; disabled: boolean }) => {
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  return <Flex direction="column" gap="2">
    <Text as="label" htmlFor="album-art-file" size="2" weight="bold">앨범아트 (선택)</Text>
    <AlbumArtwork src={preview ?? currentSrc} alt="앨범아트 미리보기" size={120} fit="contain" />
    <input id="album-art-file" name="albumArt" type="file" accept={ALBUM_ART_ACCEPT} disabled={disabled}
      onChange={(event) => {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.setCustomValidity(file && file.size > ALBUM_ART_MAX_BYTES ? "3MB 이하의 이미지를 선택해주세요." : "");
        event.currentTarget.reportValidity();
        setPreview(file && file.size <= ALBUM_ART_MAX_BYTES ? URL.createObjectURL(file) : null);
      }} />
    <Text size="1" color="gray">JPG·PNG·WebP, 최대 3MB. 이미지를 자르지 않고 비율을 유지합니다.</Text>
  </Flex>;
};
