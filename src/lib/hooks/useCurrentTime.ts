import { useSyncExternalStore } from "react";

function subscribeTime(callback: () => void) {
  const interval = setInterval(callback, 10000);
  return () => clearInterval(interval);
}

function getNowSnapshot() {
  return Date.now();
}

function getServerSnapshot() {
  return 0;
}

/**
 * Hook to get the current timestamp in a React pure and concurrency-safe manner using useSyncExternalStore.
 */
export function useCurrentTime(): number {
  return useSyncExternalStore(subscribeTime, getNowSnapshot, getServerSnapshot);
}
