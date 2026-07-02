import { atomWithStorage } from "jotai/utils";

export const fontAtom = atomWithStorage<"gothic" | "batang">("font", "batang");
