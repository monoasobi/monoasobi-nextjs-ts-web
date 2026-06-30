import { atomWithStorage } from "jotai/utils";

export const appearanceAtom = atomWithStorage<"light" | "dark">(
  "appearance",
  "light",
);
