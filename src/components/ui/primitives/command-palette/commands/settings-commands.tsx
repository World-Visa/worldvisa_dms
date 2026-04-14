'use client';

import { useRouter } from 'next/navigation';
import { ROUTES } from '@/utils/routes';
import { Command } from '../command-types';

export function useSettingsCommands(): Command[] {
  const router = useRouter();

  return [
    {
      id: 'settings-profile',
      label: 'My Profile',
      category: 'settings',
      keywords: ['profile', 'account', 'me', 'settings'],
      priority: 'low',
      execute: () => { router.push(ROUTES.PROFILE); },
    },
    {
      id: 'settings-profile-settings',
      label: 'Profile Settings',
      category: 'settings',
      keywords: ['profile', 'settings', 'account', 'preferences'],
      priority: 'low',
      execute: () => { router.push(ROUTES.PROFILE_SETTINGS); },
    },
  ];
}
