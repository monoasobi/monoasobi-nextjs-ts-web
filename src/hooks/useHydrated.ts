import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export const useHydrated = () => {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
};
