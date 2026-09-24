import { db, musics } from "@/server/db";
import { isNull } from "drizzle-orm";

export const activeMusicIds = () => db.select({ id: musics.id }).from(musics).where(isNull(musics.deletedAt));
