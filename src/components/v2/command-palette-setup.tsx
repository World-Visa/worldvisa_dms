"use client";

import { EscapeKeyManagerProvider } from "@/context/escape-key-manager/escape-key-manager";
import { CommandPaletteProvider } from "@/components/ui/primitives/command-palette/command-palette-provider";
import { CommandPalette } from "@/components/ui/primitives/command-palette/command-palette";
import { Suspense } from "react";

export function CommandPaletteSetup({ children }: { children: React.ReactNode }) {
  return (
    <EscapeKeyManagerProvider>
      <CommandPaletteProvider>
        {children}
        <Suspense fallback={null}>
          <CommandPalette />
        </Suspense>
      </CommandPaletteProvider>
    </EscapeKeyManagerProvider>
  );
}
