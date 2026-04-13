'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getFilteredSidebarItems } from '@/lib/navigations/sidebar-items';
import { ROUTES } from '@/utils/routes';
import { Command, CommandGroup } from '../command-types';
import {
  RiFileLine,
  RiFlashlightLine,
  RiHeartLine,
  RiPlayFill,
  RiSearch2Line,
  RiShieldCheckLine,
  RiUserLine,
  RiUserSearchLine,
  RiBarChartLine,
  RiPhoneLine,
  RiMailLine,
  RiMessage3Line,
} from 'react-icons/ri';

function getNavIcon(url: string) {
  if (url.startsWith(ROUTES.VISA_APPLICATIONS)) return <RiPlayFill />;
  if (url.startsWith(ROUTES.SPOUSE_SKILL_ASSESSMENT_APPLICATIONS)) return <RiHeartLine />;
  if (url.startsWith(ROUTES.REQUESTED_DOCS)) return <RiFileLine />;
  if (url.startsWith(ROUTES.QUALITY_CHECK)) return <RiUserLine />;
  const checklistPrefix = ROUTES.CHECKLIST_REQUESTS.replace('-requests', '');
  if (url.startsWith(checklistPrefix)) return <RiFlashlightLine />;

  if (url.startsWith(ROUTES.APPROVAL_REQUESTS)) return <RiShieldCheckLine />;
  if (url.startsWith(ROUTES.USERS)) return <RiUserLine />;
  if (url.startsWith(ROUTES.CLIENTS)) return <RiUserSearchLine />;
  if (url.startsWith(ROUTES.ANALYTICS)) return <RiBarChartLine />;
  if (url.startsWith(ROUTES.CALL_LOGS)) return <RiPhoneLine />;
  if (url.startsWith(ROUTES.EMAIL)) return <RiMailLine />;
  if (url.startsWith(ROUTES.CHAT)) return <RiMessage3Line />;

  return <RiSearch2Line />;
}

export function useNavigationCommands(): CommandGroup[] {
  const router = useRouter();
  const { user } = useAuth();

  const navGroups = getFilteredSidebarItems(user?.role);

  const buildCommand = useCallback(
    (label: string, url: string, disabled: boolean): Command => ({
      id: `nav-${url}`,
      label,
      category: 'navigation',
      icon: getNavIcon(url),
      keywords: [label.toLowerCase(), 'go', 'navigate', 'open'],
      priority: 'medium',
      execute: () => { router.push(url); },
      isEnabled: () => !disabled,
    }),
    [router]
  );

  return navGroups
    .map((group) => {
      const commands: Command[] = group.items.flatMap((item) => {
        if (item.subItems) {
          return item.subItems.map((sub) =>
            buildCommand(sub.title, sub.url, sub.comingSoon ?? false)
          );
        }
        return [buildCommand(item.title, item.url, item.comingSoon ?? false)];
      });

      return {
        category: 'navigation' as const,
        label: group.label ?? 'Pages',
        commands,
      };
    })
    .filter((g) => g.commands.length > 0);
}
