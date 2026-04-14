'use client';

import { useMemo } from 'react';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { Command, CommandGroup } from '../command-types';
import { useNavigationCommands } from '../commands/navigation-commands';
import { useSettingsCommands } from '../commands/settings-commands';
import { useApplicationCommands } from '../commands/application-commands';
import { useSpouseApplicationCommands } from '../commands/spouse-application-commands';
import { useRequestedDocsCommands } from '../commands/requested-docs-commands';
import { useQualityCheckCommands } from '../commands/quality-check-commands';
import { useChecklistCommands } from '../commands/checklist-commands';

const CATEGORY_LABELS: Record<string, string> = {
  navigation: 'Navigation',
  settings: 'Settings',
  applications: 'Applications',
  'spouse-applications': 'Spouse Skill Assessment',
  'requested-docs': 'Requested Documents',
  'quality-check': 'Quality Check',
  'checklist-requests': 'Checklist Requests',
};

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

export function useCommandRegistry(search = ''): CommandGroup[] {
  const isSearching = search.trim().length >= 2;

  // Navigation commands (default view)
  const navGroups = useNavigationCommands();
  const settingsCommands = useSettingsCommands();

  // Search commands — hooks always called; data is undefined when not searching
  const { data } = useGlobalSearch(search);
  const searchData = data?.data;

  const applicationCommands = useApplicationCommands(searchData?.applications);
  const spouseCommands = useSpouseApplicationCommands(searchData?.applications);
  const requestedDocsCommands = useRequestedDocsCommands(searchData?.requestedReview);
  const qualityCheckCommands = useQualityCheckCommands(searchData?.qualityCheck);
  const checklistCommands = useChecklistCommands(searchData?.checklistRequested);

  return useMemo(() => {
    if (!isSearching) {
      const dedupedSettingsCommands: Command[] = dedupeById(settingsCommands);
      const settingsGroup: CommandGroup = {
        category: 'navigation',
        label: 'Settings',
        commands: dedupedSettingsCommands,
      };
      return dedupedSettingsCommands.length > 0
        ? [...navGroups, settingsGroup]
        : navGroups;
    }

    const dedupedApplicationCommands: Command[] = dedupeById(applicationCommands);
    const dedupedSpouseCommands: Command[] = dedupeById(spouseCommands);
    const dedupedRequestedDocsCommands: Command[] = dedupeById(requestedDocsCommands);
    const dedupedQualityCheckCommands: Command[] = dedupeById(qualityCheckCommands);
    const dedupedChecklistCommands: Command[] = dedupeById(checklistCommands);

    const searchGroups: CommandGroup[] = [
      { category: 'applications', label: CATEGORY_LABELS.applications, commands: dedupedApplicationCommands },
      { category: 'spouse-applications', label: CATEGORY_LABELS['spouse-applications'], commands: dedupedSpouseCommands },
      { category: 'requested-docs', label: CATEGORY_LABELS['requested-docs'], commands: dedupedRequestedDocsCommands },
      { category: 'quality-check', label: CATEGORY_LABELS['quality-check'], commands: dedupedQualityCheckCommands },
      { category: 'checklist-requests', label: CATEGORY_LABELS['checklist-requests'], commands: dedupedChecklistCommands },
    ];

    return searchGroups.filter((g) => g.commands.length > 0);
  }, [
    isSearching,
    navGroups,
    settingsCommands,
    applicationCommands,
    spouseCommands,
    requestedDocsCommands,
    qualityCheckCommands,
    checklistCommands,
  ]);
}
