"use client";

import Image from "next/image";
import { HeaderButton } from "@/components/ui/primitives/header-button";
import { useLayoutStore } from "@/store/layoutStore";
import { useAuth } from "@/hooks/useAuth";

export default function PhoneCard() {
  const { user } = useAuth();
  const phonePanelOpen = useLayoutStore((s) => s.phonePanelOpen);
  const togglePhonePanel = useLayoutStore((s) => s.togglePhonePanel);

  if (user?.role !== "master_admin") return null;

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
