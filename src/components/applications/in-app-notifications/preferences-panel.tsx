 'use client';
 
 import { useState } from 'react';
 import { motion } from 'framer-motion';
 import { RiGlobalLine, RiMailLine } from 'react-icons/ri';
 
 import { cn } from '@/lib/utils';
 import { InAppPreviewHeader } from './in-app-preview';
 import { InboxBell } from '@/components/icons/inbox-bell';
 import {
   Accordion,
   AccordionContent,
   AccordionItem,
   AccordionTrigger,
 } from '@/components/ui/primitives/accordion';
 import { Switch } from '@/components/ui/primitives/switch';
 import { InboxSettings } from '@/components/icons/inbox-settings';
 
 type InAppPreferencesPanelProps = {
   className?: string;
   onBack: () => void;
 };
 
 export function InAppPreferencesPanel(props: InAppPreferencesPanelProps) {
   const { className, onBack } = props;
  const [openItem, setOpenItem] = useState<string>('');
 
   return (
     <motion.div
       className={cn('flex h-full flex-col', className)}
       initial={{ x: 28, opacity: 0 }}
       animate={{ x: 0, opacity: 1 }}
       exit={{ x: 28, opacity: 0 }}
       transition={{ type: 'spring', stiffness: 520, damping: 40 }}
     >
      <InAppPreviewHeader variant="preferences" title="Preferences" onBack={onBack} />
 
       <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide px-4 py-3">
        <Accordion type="single" collapsible value={openItem} onValueChange={setOpenItem}>
          <AccordionItem
            value="global"
            className={cn(
              'rounded-xl border border-neutral-200/80 bg-white/70 px-3 py-2 shadow-[0_1px_0_rgba(0,0,0,0.02)]',
            )}
          >
            <AccordionTrigger className="text-left" withChevron>
              <div className="flex w-full items-center gap-3">
                <span className="flex size-5 items-center justify-center rounded-lg bg-neutral-50 text-neutral-600 ring-1 ring-neutral-200">
                  <InboxSettings className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-normal leading-snug text-neutral-900">
                    Global Preferences
                  </div>
                  {openItem !== 'global' ? (
                    <div className="mt-0.5 text-xs font-normal text-neutral-500">Email, In-App</div>
                  ) : null}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="">
              <div className="rounded-xl border border-neutral-300/90 bg-neutral-50 ">
                <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
                  <span className="flex size-5 items-center justify-center rounded-lg bg-neutral-50 text-neutral-500">
                    <RiMailLine className="size-3.5" />
                  </span>
                  <div className="flex-1 text-xs font-normal text-neutral-900">Email</div>
                  <Switch defaultChecked />
                </div>
                <div className="mx-1 h-px bg-neutral-200/70" />
                <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
                  <span className="flex size-5 items-center justify-center rounded-lg bg-neutral-50 text-neutral-500">
                    <InboxBell className="size-3.5" />
                  </span>
                  <div className="flex-1 text-xs font-normal text-neutral-900">In-App</div>
                  <Switch defaultChecked />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
       </div>
     </motion.div>
   );
 }

