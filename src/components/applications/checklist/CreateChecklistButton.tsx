import React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CreateChecklistButtonProps {
  href: string;
  disabled?: boolean;
  className?: string;
}

export function CreateChecklistButton({
  href,
  disabled = false,
  className,
}: CreateChecklistButtonProps) {
  const content = (
    <>
      <Plus className="h-4 w-4" />
      <span>Create Checklist</span>
    </>
  );

  if (disabled) {
    return (
      <Button
        type="button"
        disabled
        variant="default"
        className={cn(
          "bg-primary-blue",
          "w-full md:w-auto",
          "opacity-50 cursor-not-allowed",
          className,
        )}
      >
        {content}
      </Button>
    );
  }

  return (
    <Button
      asChild
      variant="default"
      className={cn("bg-primary-blue", "w-full md:w-auto", className)}
    >
      <Link href={href} transitionTypes={["nav-forward"]}>
        {content}
      </Link>
    </Button>
  );
}
