import { useEffect, useState } from "react";

/** Tracks a CSS media query, re-rendering when it starts or stops matching. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/** Keep in sync with the mobile breakpoint used in styles.css. */
export const MOBILE_BREAKPOINT = 768;

/** True on phone-sized viewports, where the app switches to its mobile layout. */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT}px)`);
}
