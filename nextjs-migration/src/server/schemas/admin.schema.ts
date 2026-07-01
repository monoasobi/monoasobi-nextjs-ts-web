import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

const requiredText = z.string().trim().min(1);

const optionalId = z
  .union([z.coerce.number().int().positive(), z.literal("").transform(() => null), z.null()])
  .optional()
  .transform((value) => value ?? null);

export const musicSchema = z.object({
  title: requiredText,
  korTitle: requiredText,
  enTitle: requiredText,
  youtubeId: optionalText,
  specialPath: optionalText,
});

export const novelSchema = z.object({
  musicId: z.coerce.number().int().positive(),
  bookId: optionalId,
  title: requiredText,
  writer: requiredText,
  originUrl: requiredText,
  translator: optionalText,
  translatorUrl: optionalText,
  translated: z.coerce.boolean(),
  isPublished: z.coerce.boolean(),
});

export const comicSchema = z.object({
  musicId: z.coerce.number().int().positive(),
  title: requiredText,
  writer: requiredText,
  originUrl: requiredText,
  translator: requiredText,
  translatorUrl: requiredText,
  length: z.coerce.number().int().min(1),
});

export const lyricTrackSchema = z.object({
  musicId: z.coerce.number().int().positive(),
  sync: z.coerce.number(),
  lyricJson: z.unknown().refine((value) => Array.isArray(value), {
    message: "lyricJson must be an array",
  }),
});

export const bookSchema = z.object({
  name: requiredText,
  novelIds: z.array(z.coerce.number().int().positive()).default([]),
  purchaseLinks: z.object({
    kyoboUrl: z.string().trim().default(""),
    yes24Url: z.string().trim().default(""),
    aladinUrl: z.string().trim().default(""),
    ridiUrl: z.string().trim().default(""),
    naverUrl: z.string().trim().default(""),
  }),
});

export type MusicInput = z.infer<typeof musicSchema>;
export type NovelInput = z.infer<typeof novelSchema>;
export type ComicInput = z.infer<typeof comicSchema>;
export type LyricTrackInput = z.infer<typeof lyricTrackSchema>;
export type BookInput = z.infer<typeof bookSchema>;
