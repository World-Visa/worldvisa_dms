import { RiRouteFill } from "react-icons/ri";
import { Button } from "../ui/primitives/button";
import { cn } from "@/lib/utils";

interface SendForReviewButtonProps {
  onClick?: () => void;
  className?: string;
}

export function SendForReviewButton({
  onClick,
  className,
}: SendForReviewButtonProps) {
  return (
    <Button
      mode="gradient"
      variant="primary"
      size="2xs"
      className={cn("text-xs", className)}
      leadingIcon={RiRouteFill}
      onClick={onClick}
    >
      Send for review
    </Button>
  );
}
