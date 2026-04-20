import { useState, useEffect } from "react";

type ExtendedWindow = Window & {
  requestIdleCallback?: (
    cb: IdleRequestCallback,
    opts?: IdleRequestOptions,
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export function useLazyDocumentLoad(eagerLoad: boolean): boolean {
  const [shouldLoad, setShouldLoad] = useState(() => eagerLoad);

  useEffect(() => {
    if (eagerLoad) {
      setShouldLoad(true);
      return;
    }
    if (typeof window === "undefined") return;

    const win = window as ExtendedWindow;
    let idle: number | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const trigger = () => setShouldLoad(true);

    if (win.requestIdleCallback) {
      idle = win.requestIdleCallback(trigger, { timeout: 1500 });
    } else {
      timer = setTimeout(trigger, 200);
    }

    return () => {
      if (idle !== null && win.cancelIdleCallback) win.cancelIdleCallback(idle);
      if (timer) clearTimeout(timer);
    };
  }, [eagerLoad]);

  return shouldLoad;
}
