import { ReactNode } from 'react';

export type CommandCategory =
  | 'navigation'
  | 'settings'
  | 'applications'
  | 'spouse-applications'
  | 'requested-docs'
  | 'quality-check'
  | 'checklist-requests';

export type CommandPriority = 'high' | 'medium' | 'low';

export interface Command {
  id: string;
  label: string;
  description?: string;
  category: CommandCategory;
  keywords?: string[];
  icon?: ReactNode;
  priority?: CommandPriority;
  metadata?: {
    status?: string;
    [key: string]: unknown;
  };
  execute: () => void | Promise<void>;
  isVisible?: () => boolean;
  isEnabled?: () => boolean;
}

export interface CommandGroup {
  category: CommandCategory;
  label: string;
  commands: Command[];
}
