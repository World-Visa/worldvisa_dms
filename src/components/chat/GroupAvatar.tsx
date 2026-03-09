"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { getDefaultAvatarSrc } from "@/lib/chatAvatars";

interface GroupAvatarProps {
  memberIds: string[];
  fallbackId?: string;
  className?: string;
  alt?: string;
  memberProfiles?: Record<string, string>;
}

export function GroupAvatar({
  memberIds,
  fallbackId,
  className,
  alt = "Group",
  memberProfiles,
}: GroupAvatarProps) {
  const ids = memberIds.slice(0, 4);
  const showFallback = ids.length === 0 && fallbackId;

  const imgSrc = (id: string) => memberProfiles?.[id] ?? getDefaultAvatarSrc(id);

  if (showFallback) {
    return (
      <div
        className={cn("relative rounded-full overflow-hidden shrink-0 bg-muted", className)}
        role="img"
        aria-label={alt}
      >
        <Image
          src={getDefaultAvatarSrc(fallbackId)}
          alt={alt}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }

  if (ids.length === 1) {
    return (
      <div
        className={cn("relative rounded-full overflow-hidden shrink-0 bg-muted", className)}
        role="img"
        aria-label={alt}
      >
        <Image
          src={imgSrc(ids[0])}
          alt={alt}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden shrink-0 bg-muted grid grid-cols-2 grid-rows-2 gap-0",
        className,
      )}
      role="img"
      aria-label={alt}
    >
      {ids.length === 2 && (
        <>
          <div className="relative w-full h-full">
            <Image src={imgSrc(ids[0])} alt="" fill className="object-cover" unoptimized />
          </div>
          <div className="relative w-full h-full">
            <Image src={imgSrc(ids[1])} alt="" fill className="object-cover" unoptimized />
          </div>
        </>
      )}
      {ids.length === 3 && (
        <>
          <div className="relative w-full h-full">
            <Image src={imgSrc(ids[0])} alt="" fill className="object-cover" unoptimized />
          </div>
          <div className="relative w-full h-full">
            <Image src={imgSrc(ids[1])} alt="" fill className="object-cover" unoptimized />
          </div>
          <div className="relative w-full h-full col-span-2">
            <Image src={imgSrc(ids[2])} alt="" fill className="object-cover" unoptimized />
          </div>
        </>
      )}
      {ids.length === 4 &&
        ids.map((id, i) => (
          <div key={`${id}-${i}`} className="relative w-full h-full">
            <Image src={imgSrc(id)} alt="" fill className="object-cover" unoptimized />
          </div>
        ))}
    </div>
  );
}
