"use client";

import { useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "monoasobi-video-volume";
const VOLUME_EVENT = "monoasobi-volume-change";
const getVolume = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const value = stored == null ? 1 : Number(stored);
    return Number.isFinite(value) && value >= 0 && value <= 1 ? value : 1;
  } catch {
    return 1;
  }
};
const subscribe = (notify: () => void) => {
  window.addEventListener("storage", notify);
  window.addEventListener(VOLUME_EVENT, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(VOLUME_EVENT, notify);
  };
};

export const usePlayerVolume = () => {
  const storedVolume = useSyncExternalStore(subscribe, getVolume, () => 1);
  // Keep controls usable even when browser storage is unavailable.
  const [fallbackVolume, setFallbackVolume] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const volume = fallbackVolume ?? storedVolume;
  const changeVolume = (value: number) => {
    if (!Number.isFinite(value)) return;
    const next = Math.min(1, Math.max(0, value));
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
      setFallbackVolume(null);
      window.dispatchEvent(new Event(VOLUME_EVENT));
    } catch {
      setFallbackVolume(next);
    }
    if (next > 0) setIsMuted(false);
  };
  return {
    volume,
    isMuted,
    changeVolume,
    effectiveVolume: isMuted ? 0 : volume,
    toggleMute: () => setIsMuted((value) => !value),
  };
};
