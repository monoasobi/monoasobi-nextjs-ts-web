type NovelBase = {
  id: number;
  musicId: number;
  title: string;
  writer: string;
  originUrl: string;
};

type TranslatedInfo = {
  translated: true;
  translator: string;
  translatorUrl: string;
};

type UntranslatedInfo = {
  translated?: false | undefined;
};

type PublishedInfo = {
  isPublished: true;
  bookId: number;
};

type UnpublishedInfo = {
  isPublished?: false | undefined;
};

export type Novel =
  | (NovelBase & TranslatedInfo & PublishedInfo) // 출판된 번역본
  | (NovelBase & TranslatedInfo & UnpublishedInfo) // 미출판 번역본
  | (NovelBase & UntranslatedInfo & PublishedInfo) // 출판된 원본
  | (NovelBase & UntranslatedInfo & UnpublishedInfo); // 미출판 원본
