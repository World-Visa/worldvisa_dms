'use client';

import { useCommandState } from 'cmdk';
import { useCallback, useEffect, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import * as CommandMenu from '@/components/ui/primitives/command-palette/command-menu';
import { CommandCategory, Command as CommandType } from './command-types';
import { useCommandPalette } from './hooks/use-command-palette';
import { useCommandRegistry } from './hooks/use-command-registry';
import { Button } from '../button';
import { Kbd } from '../kbd';
import {
  RiFileLine,
  RiFlashlightLine,
  RiPlayFill,
  RiQuestionLine,
  RiRouteFill,
  RiSearch2Line,
  RiSettings4Line,
  RiUserLine,
  RiCornerDownLeftLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiCloseLine,
  RiSearchLine
} from 'react-icons/ri';
import { ListNoResults } from '@/components/applications/list-no-results';

function StatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase();
  const colorMap: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-green-50 text-green-700 border-green-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
    completed: 'bg-blue-50 text-blue-700 border-blue-200',
    reviewed: 'bg-blue-50 text-blue-700 border-blue-200',
    active: 'bg-sky-50 text-sky-700 border-sky-200',
  };
  const color =
    Object.entries(colorMap).find(([key]) => lower.includes(key))?.[1] ??
    'bg-muted text-muted-foreground border-border';

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium',
        color
      )}
    >
      {status}
    </span>
  );
}

const CategoryIconWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className={'flex size-6 items-center justify-center rounded-8 bg-bg-weak text-text-sub border border-neutral-200'}
    >
      <div className="size-3.5 flex items-center justify-center">{children}</div>
    </div>
  );
};


const getDefaultIcon = (category: CommandCategory): React.ReactNode => {
  const defaultIcons: Record<CommandCategory, React.ReactNode> = {
    'applications': <RiPlayFill />,
    'spouse-applications': <RiRouteFill />,
    'requested-docs': <RiFileLine />,
    'quality-check': <RiUserLine />,
    'checklist-requests': <RiFlashlightLine />,
    navigation: <RiSearch2Line />,
    settings: <RiSettings4Line />,
  };
  return defaultIcons[category];
};

const getCategoryActionLabel = (category: CommandCategory | undefined, value: string): string => {
  const actionLabels: Record<CommandCategory, string> = {
    'applications': 'Navigate to',
    'spouse-applications': 'Navigate to',
    'requested-docs': 'Navigate to',
    'quality-check': 'Navigate to',
    'checklist-requests': 'Navigate to',
    navigation: 'Navigate to',
    settings: 'Navigate to',
  };

  // if (value.includes('Ask AI')) {
  //   return 'Ask AI';
  // } else if (!category) {
  //   return 'Open Command';
  // }

  return actionLabels[category as CommandCategory];
};



function PaletteFooter({ commands }: { commands: CommandType[] }) {
  const selectedValue = useCommandState((state) => state.value);
  const selectedCommand = commands.find((cmd) => `${cmd.label} ${cmd.keywords?.join(' ') || ''}` === selectedValue);


  return (
    <CommandMenu.Footer className="border-t border-stroke-soft bg-bg-weak">
      <div className="flex items-center justify-between w-full py-2 pt-1.5">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            <CommandMenu.FooterKeyBox className="border-stroke-soft bg-bg-white">
              <RiArrowUpLine className="size-3 text-icon-sub" />
            </CommandMenu.FooterKeyBox>
            <CommandMenu.FooterKeyBox className="border-stroke-soft bg-bg-white">
              <RiArrowDownLine className="size-3 text-icon-sub" />
            </CommandMenu.FooterKeyBox>
          </div>
          <span className="text-sm font-normal text-text-soft">Navigate</span>
        </div>
        <Button variant="primary" size="2xs" mode="gradient" className='text-sm font'>
          <span>{getCategoryActionLabel(selectedCommand?.category, selectedValue)}</span>
          <Kbd className="border border-white/30 bg-transparent ring-transparent px-0 size-4 justify-center items-center">
            <RiCornerDownLeftLine className="size-2.5 text-white" />
          </Kbd>
        </Button>
      </div>
    </CommandMenu.Footer>
  );
}

export function CommandPalette() {
  const { isOpen, closeCommandPalette } = useCommandPalette();
  const [search, setSearch] = useState('');
  const isSearching = search.trim().length >= 2;

  const commandGroups = useCommandRegistry(search);
  const allCommands = commandGroups.flatMap((g) => g.commands);

  // React Query deduplicates this with the call inside useCommandRegistry
  const { isLoading, isFetching } = useGlobalSearch(search);

  useEffect(() => {
    if (!isOpen) setSearch('');
  }, [isOpen]);

  const executeCommand = useCallback(
    async (command: CommandType) => {
      closeCommandPalette();
      setTimeout(async () => {
        try {
          await command.execute();
        } catch {
          // no-op
        }
      }, 100);
    },
    [closeCommandPalette]
  );

  return (
    <CommandMenu.Dialog open={isOpen} onOpenChange={closeCommandPalette}>
      {/* Search input */}
      <div className="group/cmd-input flex items-center gap-2 p-3 bg-bg-weak">
        <RiSearchLine className={cn('size-5 text-text-soft')} />
        <CommandMenu.Input
          value={search}
          onValueChange={setSearch}
          placeholder="Type a command, search..."
          autoFocus
          className="text-label-md text-text-sub placeholder:text-text-soft"
        />
        <button
          onClick={closeCommandPalette}
          className="size-4 items-center justify-center rounded-6 text-text-soft hover:text-icon-sub transition-colors"
        >
          <RiCloseLine className="size-4" />
        </button>
      </div>

      <CommandMenu.List className="py-0 min-h-[400px]">
        {isSearching && !isLoading && commandGroups.length === 0 && (
          <CommandMenu.Empty>
            <ListNoResults
              title={`No results found for "${search}"`}
              description="Try a different search term or command"
              onClearFilters={() => setSearch('')}
            />
          </CommandMenu.Empty>
        )}

        {isFetching && (
          <CommandMenu.Empty>
            <div className="flex items-center justify-center gap-2">
              <RiSearch2Line className="size-5 text-text-soft animate-pulse" />
              <span className="text-sm font-normal text-text-soft">Searching...</span>
            </div>
          </CommandMenu.Empty>
        )}

        {commandGroups.map((group) => (
          <CommandMenu.Group key={`${group.category}-${group.label}`} heading={group.label} className="px-2.5">
            {group.commands.map((command) => {
              const isEnabled = command.isEnabled ? command.isEnabled() : true;
              return (
                <CommandMenu.Item
                  key={command.id}
                  value={`${command.label} ${command.keywords?.join(' ') ?? ''}`}
                  onSelect={() => isEnabled && executeCommand(command)}
                  disabled={!isEnabled}
                  className="px-1.5 rounded-8"
                >
                  <div className="flex items-center gap-1.5 flex-1">
                    <CategoryIconWrapper>{command.icon || getDefaultIcon(command.category)}</CategoryIconWrapper>
                    <span className="text-text-sub text-sm font-medium flex-1 truncate">{command.label}</span>
                    {command.description && (
                      <span className="text-text-soft text-xs font-normal truncate">{command.description}</span>
                    )}
                  </div>
                  {command.metadata?.status && (
                    <StatusBadge status={command.metadata.status as string} />
                  )}
                </CommandMenu.Item>
              );
            })}
          </CommandMenu.Group>
        ))}

        {/* AI / Inkeep search — commented out, implement later */}
        {/* {isSearching && (
          <CommandMenu.Group heading="AI Assistant">
            <CommandMenu.Item value={`Ask AI ${search}`} onSelect={openAiDrawer}>
              Ask AI &quot;{search}&quot;
            </CommandMenu.Item>
          </CommandMenu.Group>
        )} */}
      </CommandMenu.List>

      <PaletteFooter commands={allCommands} />
    </CommandMenu.Dialog>
  );
}
