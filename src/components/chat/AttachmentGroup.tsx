"use client";

import Image from "next/image";
import { FileIcon, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatAttachment } from "@/types/chat";

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Renders one or more images edge-to-edge (no padding) — used inside a bubble or standalone. */
export function ImageSection({ images }: { images: ChatAttachment[] }) {
  if (images.length === 1) {
    return (
      <a
        href={images[0].url}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full"
      >
        <div className="relative w-full aspect-4/3 min-w-[160px]">
          <Image
            src={images[0].url}
            alt={images[0].name}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      </a>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-0.5 w-full">
      {images.map((att, i) => (
        <a
          key={i}
          href={att.url}
          target="_blank"
          rel="noopener noreferrer"
          className="relative aspect-square block"
        >
          <Image
            src={att.url}
            alt={att.name}
            fill
            className="object-cover"
            unoptimized
          />
        </a>
      ))}
    </div>
  );
}

/** A single file or PDF card rendered inside a message bubble. */
export function FileCard({
  attachment,
  isOwn,
}: {
  attachment: ChatAttachment;
  isOwn: boolean;
}) {
  const isPdf = attachment.contentType === "application/pdf";

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
        isOwn
          ? "bg-background/15 hover:bg-background/25 text-background"
          : "bg-background/50 hover:bg-background/70 text-foreground",
      )}
    >
      {isPdf ? (
        <Image
          src="/icons/pdf_small.svg"
          alt="PDF"
          width={32}
          height={32}
          className="shrink-0"
          unoptimized
        />
      ) : (
        <div className="h-8 w-8 rounded-lg bg-muted-foreground/15 flex items-center justify-center shrink-0">
          <FileIcon className="h-4 w-4 opacity-60" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{attachment.name}</p>
        <p className="text-[10px] opacity-60 mt-0.5">
          {formatFileSize(attachment.size)}
          {isPdf ? " · PDF" : ""}
        </p>
      </div>
      <Download className="h-3.5 w-3.5 shrink-0 opacity-60" />
    </a>
  );
}
