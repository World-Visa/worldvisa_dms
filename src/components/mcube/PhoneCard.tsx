"use client";

import Image from "next/image";
import { HeaderButton } from "@/components/ui/primitives/header-button";
import { useLayoutStore } from "@/store/layoutStore";

export default function PhoneCard() {
  const phonePanelOpen = useLayoutStore((s) => s.phonePanelOpen);
  const togglePhonePanel = useLayoutStore((s) => s.togglePhonePanel);

  return (
    <HeaderButton
      label="Softphone"
      aria-expanded={phonePanelOpen}
      aria-pressed={phonePanelOpen}
      onClick={togglePhonePanel}
    >
      <Image src="/icons/call.png" alt="Softphone" width={20} height={20} />
    </HeaderButton>
  );
}
