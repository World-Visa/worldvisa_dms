"use client";

import { useCommandPalette } from "@/components/ui/primitives/command-palette/hooks/use-command-palette";
import { RiSearchLine } from "react-icons/ri";
import { Button } from "@/components/ui/primitives/button";
import { Kbd } from "@/components/ui/primitives/kbd";

export function SearchDialog() {
  const { openCommandPalette } = useCommandPalette();

  return (
    <>
      <Button
        variant="secondary"
        mode="outline"
        className="hidden h-[26px] text-sm px-[5px] md:inline-flex"
        size="2xs"
        onClick={openCommandPalette}
      >
        <RiSearchLine className="size-3 text-text-sub" /> <span className="text-sm">Search</span>
        <Kbd className="bg-bg-weak rounded-4 text-sm font-normal text-text-sub h-[16px]">⌘K</Kbd>
      </Button>
      <Button
        variant="secondary"
        mode="outline"
        className="h-[26px] px-[5px] md:hidden"
        size="2xs"
        onClick={openCommandPalette}
      >
        <RiSearchLine className="size-3 text-text-sub" />
      </Button>
    </>
  );
}
