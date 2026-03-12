import * as React from "react";

const LAYOUT_BREAKPOINT = 1024;

/** [nav, list, display] as percentage strings. Used when no saved layout cookie. */
const WIDE_DEFAULTS: [string, string, string] = ["20", "32", "48"];
const NARROW_DEFAULTS: [string, string, string] = ["15", "40", "45"];

export function useResponsiveMailLayout(): [string, string, string] {
  const [sizes, setSizes] = React.useState<[string, string, string]>(WIDE_DEFAULTS);

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${LAYOUT_BREAKPOINT}px)`);
    const update = () => {
      setSizes(window.innerWidth >= LAYOUT_BREAKPOINT ? WIDE_DEFAULTS : NARROW_DEFAULTS);
    };
    mql.addEventListener("change", update);
    update();
    return () => mql.removeEventListener("change", update);
  }, []);

  return sizes;
}
