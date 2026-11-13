import { useCallback, useSyncExternalStore } from "react";

export const ROUTES = ["vandaag", "agenda", "taken", "aantekeningen", "instellingen"] as const;
export type RouteName = (typeof ROUTES)[number];

function read(): RouteName {
  if (typeof window === "undefined") return "vandaag";
  const name = window.location.hash.replace(/^#\/?/, "").split(/[?/]/)[0] ?? "";
  return (ROUTES as readonly string[]).includes(name) ? (name as RouteName) : "vandaag";
}

function subscribe(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}

/** Minimal hash router: works on GitHub Pages without server rewrites. */
export function useHashRoute(): [RouteName, (r: RouteName) => void] {
  const route = useSyncExternalStore(subscribe, read, () => "vandaag" as RouteName);
  const go = useCallback((r: RouteName) => {
    if (read() !== r) window.location.hash = `/${r}`;
    window.scrollTo({ top: 0 });
  }, []);
  return [route, go];
}

