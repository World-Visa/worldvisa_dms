"use client";

import dynamic from "next/dynamic";

const McubePhoneWidget = dynamic(
  () => import("./McubePhoneWidget").then((m) => ({ default: m.McubePhoneWidget })),
  { ssr: false },
);

export function McubePhoneWidgetLoader() {
  return <McubePhoneWidget />;
}
