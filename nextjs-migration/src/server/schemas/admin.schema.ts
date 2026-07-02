import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null));

const requiredText = z.string().trim().min(1);
const requiredUrl = requiredText.url("올바른 URL을 입력해주세요.");
const optionalUrl = optionalText.refine(
  (value) => value === null || URL.canParse(value),
  "올바른 URL을 입력해주세요.",
);
const optionalUrlText = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || URL.canParse(value), {
    message: "올바른 URL을 입력해주세요.",
  });

const optionalId = z
  .union([
    z.coerce.number().int().positive(),
    z.literal("").transform(() => null),
    z.null(),
  ])
  .optional()
  .transform((value) => value ?? null);

export const musicSchema = z.object({
  title: requiredText,
  korTitle: requiredText,
  enTitle: requiredText,
  youtubeId: optionalText,
  specialPath: optionalText,
});

export const novelSchema = z
  .object({
    musicId: z.coerce.number().int().positive(),
    bookId: optionalId,
    title: requiredText,
    writer: requiredText,
    originUrl: requiredUrl,
    translator: optionalText,
    translatorUrl: optionalUrl,
    translated: z.coerce.boolean(),
    isPublished: z.coerce.boolean(),
  })
  .superRefine((value, context) => {
    if (value.translated && !value.translator) {
      context.addIssue({
        code: "custom",
        path: ["translator"],
        message: "번역본은 역자 이름이 필요합니다.",
      });
    }

    if (value.translated && !value.translatorUrl) {
      context.addIssue({
        code: "custom",
        path: ["translatorUrl"],
        message: "번역본은 역자 URL이 필요합니다.",
      });
    }

    if (value.isPublished && !value.bookId) {
      context.addIssue({
        code: "custom",
        path: ["bookId"],
        message: "출판된 소설은 연결할 book이 필요합니다.",
      });
    }
  });

export const comicSchema = z.object({
  musicId: z.coerce.number().int().positive(),
  title: requiredText,
  writer: requiredText,
  originUrl: requiredUrl,
  translator: requiredText,
  translatorUrl: requiredUrl,
  length: z.coerce.number().int().min(1),
});

export const lyricTrackSchema = z.object({
  musicId: z.coerce.number().int().positive(),
  sync: z.coerce.number(),
  lyricJson: z.unknown(),
});

export const bookSchema = z.object({
  name: requiredText,
  novelIds: z.array(z.coerce.number().int().positive()).default([]),
  purchaseLinks: z.object({
    kyoboUrl: optionalUrlText.default(""),
    yes24Url: optionalUrlText.default(""),
    aladinUrl: optionalUrlText.default(""),
    ridiUrl: optionalUrlText.default(""),
    naverUrl: optionalUrlText.default(""),
  }),
});

export type MusicInput = z.infer<typeof musicSchema>;
export type NovelInput = z.infer<typeof novelSchema>;
export type ComicInput = z.infer<typeof comicSchema>;
export type LyricTrackInput = z.infer<typeof lyricTrackSchema>;
export type BookInput = z.infer<typeof bookSchema>;
