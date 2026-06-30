import { musics } from "@lib/music";
import { novels } from "@lib/novel";
import { notFound } from "next/navigation";
import { NovelPageClient } from "./_components/NovelPageClient";

interface NovelPageProps {
  params: Promise<{ id: string }>;
}

export default async function NovelPage({ params }: NovelPageProps) {
  const { id } = await params;
  const novelId = Number(id);
  const novel = novels.find((novel) => novel.id === novelId);
  const music = musics.find((music) => music.id === novel?.musicId);

  if (!Number.isInteger(novelId) || !novel || !music) notFound();

  return <NovelPageClient id={novelId} />;
}
