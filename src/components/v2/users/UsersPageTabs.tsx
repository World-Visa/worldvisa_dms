"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface PageTab {
  value: string;
  label: string;
  path: string;
}

const USERS_TABS: PageTab[] = [
  { value: "all-users", label: "All Users", path: "/v2/users" },
  { value: "invitations", label: "Invitations", path: "/v2/users/invitations" },
];

interface UsersPageTabsProps {
  children: ReactNode;
  tabs?: PageTab[];
}

export function UsersPageTabs({ children, tabs = USERS_TABS }: UsersPageTabsProps) {
  const pathname = usePathname();
  const router = useRouter();

  const activeTab = tabs.find((t) => t.path === pathname)?.value ?? tabs[0].value;

  return (
    <Tabs
      value={activeTab}
      onValueChange={(tab) => {
        const target = tabs.find((t) => t.value === tab);
        if (target) router.push(target.path);
      }}
      className="w-full px-0!"
    >
      <TabsList variant="regular" align="start" className="border-t-transparent py-0!">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} variant="regular" size="xl">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <div className="mx-auto mt-1 max-w-full px-1.5">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="mt-6"
        >
          {children}
        </motion.div>
      </div>
    </Tabs>
  );
}
