import { RiBookMarkedLine } from 'react-icons/ri';
import { LinkButton } from '@/components/ui/primitives/button-link';
import { EmptyCallIllustration } from './empty-call-illustration';
import Link from 'next/link';
import { ROUTES } from '@/utils/routes';

interface CallListBlankProps {
  title?: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}

export const CallListBlank = ({
  title = "No call logs yet",
  description = "Once calls are made or received, they’ll appear here for quick review and follow-ups.",
  actionHref = ROUTES.VISA_APPLICATIONS,
  actionLabel = "View Applications",
}: CallListBlankProps) => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6">
      <EmptyCallIllustration />
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="text-text-sub text-label-md block font-medium">{title}</span>
        <p className="text-text-soft text-paragraph-sm max-w-[60ch]">
          {description}
        </p>
      </div>

      {actionHref && actionLabel ? (
        <div className="flex items-center justify-center gap-6">
          <Link href={actionHref}>
            <LinkButton variant="gray" trailingIcon={RiBookMarkedLine}>
              {actionLabel}
            </LinkButton>
          </Link>
        </div>
      ) : null}
    </div>
  );
};
