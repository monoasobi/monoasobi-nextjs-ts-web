import { atomWithStorage } from "jotai/utils";

export const privateReaderAtom = atomWithStorage("privateReader", false);
