import { useEffect, useRef } from "react";

/**
 * Subscribes to a window event for the lifetime of the component.
 * The handler is kept in a ref (latest-value pattern) so callers can pass
 * inline closures without re-subscribing on every render.
 */
export function useWindowEvent<K extends keyof WindowEventMap>(
  type: K,
  handler: (event: WindowEventMap[K]) => void,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const listener = (event: WindowEventMap[K]) => handlerRef.current(event);
    window.addEventListener(type, listener);
    return () => window.removeEventListener(type, listener);
  }, [type]);
}
