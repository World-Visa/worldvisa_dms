"use client";
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { UserProfile } from '@clerk/nextjs';
import type { Appearance } from '@clerk/types';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export const FADE_ANIMATION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
} as const;

const getClerkComponentAppearance = (isRbacEnabled: boolean): Appearance => ({
  variables: {
    colorPrimary: 'var(--bg-surface)',
    colorText: 'rgba(82, 88, 102, 0.95)',
    fontSize: '14px',
  },
  elements: {
    navbar: { display: 'none' },
    navbarMobileMenuRow: { display: 'none !important' },
    rootBox: {
      width: '100%',
      height: '100%',
    },
    cardBox: {
      display: 'block',
      width: '100%',
      height: '100%',
      boxShadow: 'none',
    },

    pageScrollBox: {
      padding: '0 !important',
    },
    header: {
      display: 'none',
    },
    profileSection: {
      borderBottom: 'none',
      borderTop: '1px solid var(--neutral-100)',
    },
    profileSectionTitleText: {
      color: 'hsl(var(--text-strong))',
    },
    page: {
      padding: '0 5px',
    },
    selectButton__role: {
      visibility: isRbacEnabled ? 'visible' : 'hidden',
    },
    formFieldRow__role: {
      visibility: isRbacEnabled ? 'visible' : 'hidden',
    },
    apiKeys: 'py-1',
  },
});

type Tab = 'account' | 'security';

const TABS: { label: string; value: Tab }[] = [
  { label: 'Account', value: 'account' },
  { label: 'Security', value: 'security' },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const clerkAppearance = getClerkComponentAppearance(true);

  return (
    <motion.div {...FADE_ANIMATION} className='max-w-2xl mx-auto'>
      <div className="flex gap-1 border-b mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors relative',
              activeTab === tab.value
                ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="border-none shadow-none">
        <div className="pb-6 flex flex-col">
          {activeTab === 'account' && (
            <UserProfile appearance={clerkAppearance} routing='hash'>
              <UserProfile.Page label="account" />
              <UserProfile.Page label="security" />
            </UserProfile>
          )}
          {activeTab === 'security' && (
            <UserProfile appearance={clerkAppearance} routing='hash'>
              <UserProfile.Page label="security" />
              <UserProfile.Page label="account" />
            </UserProfile>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default Settings;
