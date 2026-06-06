"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { RiAddLine, RiArrowRightSLine, RiSearchLine } from "react-icons/ri";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SPRING_ENTRY, SPRING_LAYOUT, SPRING_PRESS } from "@/components/applications/deadline/deadline-motion";
import {
  DEADLINE_EXPANDED_PANEL_GRAY,
  DEADLINE_INNER_CARD_RADIUS_PX,
  DEADLINE_WHITE_CARD_SHADOW,
} from "@/components/applications/deadline/deadline-tokens";
import { useDebounce } from "@/hooks/useDebounce";
import { useSearchApplications } from "@/hooks/useSearchApplications";
import { useCreateTask } from "@/hooks/useApplicationTasks";
import { cn, getInitials, getProfileAvatarSrc } from "@/lib/utils";
import type { Application } from "@/types/applications";
import type { TaskFormData } from "@/types/tasks";
import { AddTaskPopover } from "../AddTaskPopover";

const DARK_BUTTON_SURFACE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(180deg, rgba(255,255,255,0.153) 6.6667%, rgba(255,255,255,0) 103.33%)," +
    "linear-gradient(90deg, #171717 0%, #171717 100%)",
  boxShadow:
    "0px 0px 0px 0.75px #171717," +
    "inset 0px 1px 2px 0px rgba(255,255,255,0.16)",
};

const labelMuted =
  "font-medium text-[13px] leading-5 tracking-[-0.078px] text-[#a3a3a3] select-none";

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function InnerCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("relative w-full overflow-hidden", className)}
      style={{
        borderRadius: DEADLINE_INNER_CARD_RADIUS_PX,
        background: "white",
        boxShadow: DEADLINE_WHITE_CARD_SHADOW,
      }}
    >
      {children}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{ boxShadow: "inset 0px -1px 1px -0.5px rgba(51,51,51,0.06)" }}
      />
    </div>
  );
}

function ApplicationPickerSkeleton() {
  return (
    <div className="flex flex-col gap-1.5 p-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-[52px] animate-pulse rounded-[12px]"
          style={{ background: DEADLINE_EXPANDED_PANEL_GRAY, opacity: 1 - i * 0.12 }}
        />
      ))}
    </div>
  );
}

function ApplicationRow({
  app,
  index,
  reduced,
  onSelect,
}: {
  app: Application;
  index: number;
  reduced: boolean;
  onSelect: (id: string, name: string) => void;
}) {
  const avatarSrc = getProfileAvatarSrc({
    profileImageUrl: app.profile_image_url,
    seed: app.Name,
  });

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: reduced ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? { duration: 0.15 } : { ...SPRING_ENTRY, delay: 0.04 + index * 0.04 }}
      onClick={() => onSelect(app.id, app.Name)}
      className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left outline-none transition-colors hover:bg-[#fafafa] focus-visible:ring-2 focus-visible:ring-[#c0d5ff]"
      whileTap={reduced ? {} : { scale: 0.99 }}
    >
      <Avatar className="size-9 shrink-0 ring-1 ring-[#ebebeb]">
        <AvatarImage src={avatarSrc} alt={app.Name} />
        <AvatarFallback className="text-[11px] font-medium">
          {getInitials(app.Name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p
          className="truncate text-[14px] font-medium leading-5 tracking-[-0.084px] text-[#171717]"
          style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
        >
          {app.Name}
        </p>
        <p className="truncate text-[12px] leading-4 text-[#a3a3a3]">{app.Email}</p>
      </div>
      <RiArrowRightSLine className="size-4 shrink-0 text-[#d4d4d4]" />
    </motion.button>
  );
}

function ApplicationPicker({
  search,
  onSearchChange,
  applications,
  isLoading,
  debouncedSearch,
  reduced,
  onSelect,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  applications: Application[];
  isLoading: boolean;
  debouncedSearch: string;
  reduced: boolean;
  onSelect: (id: string, name: string) => void;
}) {
  const showEmpty = debouncedSearch.length > 0 && !isLoading && applications.length === 0;
  const showHint = debouncedSearch.length === 0;

  return (
    <motion.div
      key="pick"
      className="flex w-full flex-col"
      style={{ gap: 12 }}
      exit={{
        opacity: 0,
        scale: 0.97,
        transition: { duration: 0.14, ease: [0.4, 0, 1, 1] },
      }}
    >
      <motion.div
        className="flex shrink-0 items-start justify-between px-2.5"
        initial={{ opacity: 0, y: reduced ? 0 : 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduced ? { duration: 0.15 } : { ...SPRING_ENTRY, delay: 0.08 }}
      >
        <div className="flex flex-col gap-0.5">
          <p className={labelMuted} style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}>
            New task
          </p>
          <p
            className="text-[15px] font-medium leading-5 tracking-[-0.09px] text-[#171717]"
            style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
          >
            Select application
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: reduced ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduced ? { duration: 0.15 } : { ...SPRING_ENTRY, delay: 0.14 }}
      >
        <InnerCard>
          <div className="flex items-center gap-2.5 border-b border-[#f5f5f5] px-3.5 py-3">
            <RiSearchLine className="size-4 shrink-0 text-[#a3a3a3]" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by name or email…"
              autoFocus
              className="min-w-0 flex-1 bg-transparent text-[14px] font-medium leading-5 tracking-[-0.084px] text-[#171717] outline-none placeholder:font-normal placeholder:text-[#a3a3a3]"
            />
          </div>

          <div className="max-h-[280px] overflow-y-auto [scrollbar-width:thin]">
            {showHint ? (
              <div className="flex flex-col items-center justify-center gap-1 px-4 py-10 text-center">
                <p className="text-[13px] font-medium text-[#737373]">Find an application</p>
                <p className="max-w-[220px] text-[12px] leading-relaxed text-[#a3a3a3]">
                  Start typing a client name or email to attach this task.
                </p>
              </div>
            ) : isLoading ? (
              <ApplicationPickerSkeleton />
            ) : showEmpty ? (
              <div className="px-4 py-10 text-center">
                <p className="text-[13px] font-medium text-[#737373]">No applications found</p>
                <p className="mt-1 text-[12px] text-[#a3a3a3]">Try a different search term.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5 p-1.5">
                {applications.map((app, index) => (
                  <ApplicationRow
                    key={app.id}
                    app={app}
                    index={index}
                    reduced={!!reduced}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            )}
          </div>
        </InnerCard>
      </motion.div>
    </motion.div>
  );
}

export function NewTaskDialog({ open, onOpenChange }: NewTaskDialogProps) {
  const reduced = useReducedMotion();
  const [step, setStep] = useState<"pick" | "form">("pick");
  const [search, setSearch] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [addSession, setAddSession] = useState(0);

  const debouncedSearch = useDebounce(search.trim(), 350);
  const { data, isLoading } = useSearchApplications({
    search: debouncedSearch,
    limit: 8,
  });

  const createTaskMutation = useCreateTask(selectedLeadId ?? "");

  const applications = data?.data ?? [];

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setStep("pick");
      setSearch("");
      setSelectedLeadId(null);
      setSelectedName("");
    }
    onOpenChange(next);
  };

  const handleSelectApplication = (id: string, name: string) => {
    setSelectedLeadId(id);
    setSelectedName(name);
    setStep("form");
    setAddSession((k) => k + 1);
  };

  const handleSave = async (formData: TaskFormData) => {
    if (!selectedLeadId) return;
    await createTaskMutation.mutateAsync(formData);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={step === "pick"}
        className="w-[min(100vw-2rem,400px)] max-w-[400px] gap-0 overflow-visible border-0 bg-transparent p-0 shadow-none sm:max-w-[400px]"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('[role="toolbar"]')) e.preventDefault();
        }}
      >
        <DialogTitle className="sr-only">
          {step === "pick" ? "Select application" : "Add task"}
        </DialogTitle>

        <motion.div
          layout
          className="flex w-full flex-col overflow-hidden rounded-[24px]"
          style={{
            background: "#f7f7f7",
            willChange: "transform",
            gap: step === "form" ? 4 : 12,
            paddingTop: step === "form" ? 4 : 12,
            paddingLeft: 4,
            paddingRight: 4,
            paddingBottom: 4,
          }}
          transition={SPRING_LAYOUT}
          initial={{ opacity: 0, y: reduced ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {step === "pick" ? (
              <ApplicationPicker
                search={search}
                onSearchChange={setSearch}
                applications={applications}
                isLoading={isLoading}
                debouncedSearch={debouncedSearch}
                reduced={!!reduced}
                onSelect={handleSelectApplication}
              />
            ) : (
              <motion.div
                key="form"
                className="w-full"
                exit={{ opacity: 0, transition: { duration: 0.08 } }}
              >
                <AddTaskPopover
                  key={addSession}
                  applicationId={selectedLeadId!}
                  onBack={() => setStep("pick")}
                  onClose={() => handleOpenChange(false)}
                  onSave={handleSave}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

export function NewTaskButton({ onClick }: { onClick: () => void }) {
  const reduced = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-1.5 rounded-[8px] px-3 outline-none focus-visible:ring-2 focus-visible:ring-[#c0d5ff] focus-visible:ring-offset-1"
      style={DARK_BUTTON_SURFACE}
      whileHover={reduced ? {} : { opacity: 0.88 }}
      whileTap={reduced ? {} : { scale: 0.96 }}
      transition={SPRING_PRESS}
    >
      <RiAddLine className="size-4 text-white" />
      <span
        className="select-none text-[13px] font-medium leading-5 tracking-[-0.078px] text-white"
        style={{ fontFeatureSettings: "'ss11', 'calt' 0" }}
      >
        New task
      </span>
    </motion.button>
  );
}
