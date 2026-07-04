import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

interface SidebarState {
  isOpen: boolean;
  scrollTop: number;
}

const SIDEBAR_STORAGE_KEY = "sidebar";
const DEFAULT_SIDEBAR_STATE: SidebarState = {
  isOpen: true,
  scrollTop: 0,
};

const getSessionStorage = () => {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
};

const parseSidebarState = (
  rawValue: string,
  initialValue: SidebarState,
): SidebarState => {
  try {
    const parsed = JSON.parse(rawValue);

    if (typeof parsed === "number" && Number.isFinite(parsed)) {
      return { ...initialValue, scrollTop: parsed };
    }

    if (!parsed || typeof parsed !== "object") return initialValue;

    return {
      isOpen:
        typeof parsed.isOpen === "boolean" ? parsed.isOpen : initialValue.isOpen,
      scrollTop:
        typeof parsed.scrollTop === "number" && Number.isFinite(parsed.scrollTop)
          ? parsed.scrollTop
          : initialValue.scrollTop,
    };
  } catch {
    const scrollTop = Number(rawValue);
    return Number.isFinite(scrollTop)
      ? { ...initialValue, scrollTop }
      : initialValue;
  }
};

const sidebarStorage = {
  getItem: (key: string, initialValue: SidebarState) => {
    const storage = getSessionStorage();
    const rawValue = storage?.getItem(key);
    return rawValue == null
      ? initialValue
      : parseSidebarState(rawValue, initialValue);
  },
  setItem: (key: string, value: SidebarState) => {
    getSessionStorage?.()?.setItem(key, JSON.stringify(value));
  },
  removeItem: (key: string) => {
    getSessionStorage?.()?.removeItem(key);
  },
};

export const sidebarStateAtom = atomWithStorage<SidebarState>(
  SIDEBAR_STORAGE_KEY,
  DEFAULT_SIDEBAR_STATE,
  sidebarStorage,
  { getOnInit: true },
);

export const sidebarAtom = atom(
  (get) => get(sidebarStateAtom).isOpen,
  (get, set, nextValue: boolean | ((prev: boolean) => boolean)) => {
    const prev = get(sidebarStateAtom);
    const isOpen =
      typeof nextValue === "function" ? nextValue(prev.isOpen) : nextValue;

    set(sidebarStateAtom, { ...prev, isOpen });
  },
);

export const sidebarScrollTopAtom = atom(
  (get) => get(sidebarStateAtom).scrollTop,
  (get, set, nextValue: number | ((prev: number) => number)) => {
    const prev = get(sidebarStateAtom);
    const scrollTop =
      typeof nextValue === "function" ? nextValue(prev.scrollTop) : nextValue;

    set(sidebarStateAtom, { ...prev, scrollTop });
  },
);
