"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Icon } from "@iconify/react";
import TruncatedText from "@/components/ui/truncated-text";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { SPRING_OUTCOME } from "@/components/applications/deadline/deadline-motion";
import {
  formatKanbanCardDate,
  formatTaskStartTime,
  formatTaskWhen,
  getTaskStrikethroughClass,
  normalizeMeetingUrl,
  taskToFormData,
  TASK_CARD_SHADOW,
} from "@/lib/constants/tasks";
import { cn, getInitials, getProfileAvatarSrc } from "@/lib/utils";
import { ROUTES } from "@/utils/routes";
import type { ApplicationTask, TaskFormData } from "@/types/tasks";
import { AddTaskPopover } from "./AddTaskPopover";
import { TaskStatusBadge } from "./TaskStatusBadge";

const mountSpring = { type: "spring" as const, duration: 0.45, bounce: 0 };
const iconPop = { type: "spring" as const, duration: 0.3, bounce: 0 };

const labelCls =
  "text-[14px] font-normal leading-5 tracking-[-0.084px] text-[#5c5c5c] whitespace-nowrap";
const valueCls =
  "text-[14px] font-medium leading-5 tracking-[-0.084px] text-[#5c5c5c]";

interface TaskListCardProps {
  task: ApplicationTask;
  index: number;
  isClientView: boolean;
  onSave: (taskId: string, data: TaskFormData) => void | Promise<void>;
  onDelete: (taskId: string) => void | Promise<void>;
  variant?: "list" | "kanban";
  showClientAvatar?: boolean;
  hideStatusBadge?: boolean;
  disableAnimations?: boolean;
}

function CardActionSlot({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className="relative z-10 flex shrink-0 items-center overflow-hidden"
      initial={false}
      animate={{
        width: visible ? 60 : 0,
        opacity: visible ? 1 : 0,
        scale: visible ? 1 : 0.9,
        filter: visible ? "blur(0px)" : "blur(4px)",
      }}
      transition={iconPop}
    >
      {children}
    </motion.div>
  );
}

function MetaRow({
  icon,
  label,
  delay,
  children,
  disableAnimations,
}: {
  icon: string;
  label: string;
  delay: number;
  children: React.ReactNode;
  disableAnimations?: boolean;
}) {
  const reduced = useReducedMotion();

  const content = (
    <div className="flex min-w-0 items-center justify-between gap-2">
      <div className="flex shrink-0 items-center gap-2">
        <Icon icon={icon} width={20} height={20} className="shrink-0 text-[#A4A4A4]" />
        <span className={labelCls}>{label}</span>
      </div>
      <div className="flex min-w-0 flex-1 justify-end">{children}</div>
    </div>
  );

  if (disableAnimations) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: reduced ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...mountSpring, delay }}
    >
      {content}
    </motion.div>
  );
}

function KanbanAvatarStack({
  createdByName,
  createdByAvatarSrc,
  clientName,
  clientAvatarSrc,
  applicationHref,
  showClientAvatar,
}: {
  createdByName: string;
  createdByAvatarSrc: string;
  clientName: string;
  clientAvatarSrc: string;
  applicationHref: string;
  showClientAvatar: boolean;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className="flex shrink-0 items-center"
      whileHover={reduced ? {} : { scale: 1.04 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
    >
      <div className="flex -space-x-2">
        <Avatar
          className="size-6 ring-2 ring-white"
          title={`Created by: ${createdByName}`}
        >
          <AvatarImage src={createdByAvatarSrc} alt={createdByName} />
          <AvatarFallback className="bg-[#eff6ff] text-[9px] font-medium text-[#2563eb]">
            {getInitials(createdByName)}
          </AvatarFallback>
        </Avatar>

        {showClientAvatar ? (
          <Link
            href={applicationHref}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label={`View ${clientName}'s application`}
            title={clientName}
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#335cff]/25"
          >
            <Avatar className="size-6 ring-2 ring-white">
              <AvatarImage src={clientAvatarSrc} alt={clientName} />
              <AvatarFallback className="bg-[#f5f5f5] text-[9px] font-medium text-[#525252]">
                {getInitials(clientName)}
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : null}
      </div>
    </motion.div>
  );
}

function KanbanCardFooter({
  task,
  showClientAvatar,
  clientName,
  clientAvatarSrc,
  createdByName,
  createdByAvatarSrc,
  applicationHref,
}: {
  task: ApplicationTask;
  showClientAvatar: boolean;
  clientName: string;
  clientAvatarSrc: string;
  createdByName: string;
  createdByAvatarSrc: string;
  applicationHref: string;
}) {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const { label: dateLabel, isToday } = formatKanbanCardDate(task.date);
  const hasLink = Boolean(task.meetingLink?.trim());
  const timeLabel = formatTaskStartTime(task.timeStart);

  useEffect(() => {
    setMounted(true);
  }, []);
  const meetingUrl = hasLink ? normalizeMeetingUrl(task.meetingLink!) : "";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.25, delay: reduced ? 0 : 0.08 }}
      className="mt-auto flex items-center justify-between gap-2 pt-2.5"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <div className="flex shrink-0 items-center gap-1">
          <Icon
            icon="mingcute:calendar-2-line"
            width={13}
            height={13}
            className="text-[#a3a3a3]"
          />
          {mounted && isToday ? (
            <span className="rounded-md bg-[#fef2f2] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-[#dc2626]">
              Today
            </span>
          ) : (
            <span className="text-[11px] font-medium leading-none text-[#737373] tabular-nums">
              {dateLabel}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 text-[#a3a3a3]">
          <Icon icon="mingcute:time-line" width={13} height={13} />
          <span className="text-[11px] font-medium leading-none tabular-nums text-[#737373]">
            {timeLabel}
          </span>
        </div>

        {hasLink ? (
          <motion.a
            href={meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open meeting link"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            whileHover={reduced ? {} : { scale: 1.08 }}
            whileTap={reduced ? {} : { scale: 0.94 }}
            className="flex shrink-0 items-center justify-center rounded-md p-0.5 text-[#a3a3a3] transition-colors hover:bg-[#f7f7f7] hover:text-[#335cff]"
          >
            <Icon icon="mingcute:link-2-line" width={13} height={13} />
          </motion.a>
        ) : null}
      </div>

      <KanbanAvatarStack
        createdByName={createdByName}
        createdByAvatarSrc={createdByAvatarSrc}
        clientName={clientName}
        clientAvatarSrc={clientAvatarSrc}
        applicationHref={applicationHref}
        showClientAvatar={showClientAvatar}
      />
    </motion.div>
  );
}

export function TaskListCard({
  task,
  index,
  isClientView,
  onSave,
  onDelete,
  variant = "list",
  showClientAvatar = false,
  hideStatusBadge = false,
  disableAnimations = false,
}: TaskListCardProps) {
  const reduced = useReducedMotion();
  const isKanban = variant === "kanban";
  const [hovered, setHovered] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editSession, setEditSession] = useState(0);

  const whenLabel = formatTaskWhen(task.date, task.timeStart, task.timeEnd);
  const rowBaseDelay = 0.08 + Math.min(index * 0.04, 0.2);
  const strikeClass = getTaskStrikethroughClass(task.status);
  const clientName = task.client?.name ?? "Client";
  const applicationHref = isClientView
    ? ROUTES.CLIENT_APPLICATION_DETAILS(task.applicationId)
    : ROUTES.APPLICATION_DETAILS(task.applicationId);
  const clientAvatarSrc = getProfileAvatarSrc({
    profileImageUrl: task.client?.profile_image_url,
    seed: task.client?.name ?? task.applicationId,
  });
  const createdByName =
    task.createdByInfo?.name ?? task.createdBy ?? "Team member";
  const createdByAvatarSrc = getProfileAvatarSrc({
    profileImageUrl: task.createdByInfo?.profile_image_url,
    seed: task.createdByInfo?.username ?? task.createdBy ?? createdByName,
  });
  const titleClass = cn(
    "w-full max-w-full leading-5 tracking-[-0.084px]",
    isKanban ? "text-[13px] font-semibold" : "text-[14px] font-medium",
    strikeClass || "text-[#171717]",
  );
  const descClass = cn(
    "w-full max-w-full font-normal leading-5 tracking-[-0.084px]",
    isKanban ? "line-clamp-2 text-[12px] leading-4" : "text-[14px]",
    strikeClass || "text-[#737373]",
  );

  const handleEditOpenChange = (open: boolean) => {
    setIsEditOpen(open);
    if (open) setEditSession((k) => k + 1);
  };

  const handleSave = async (data: TaskFormData) => {
    await onSave(task.id, data);
    setIsEditOpen(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(task.id);
      toast.success("Task deleted");
      setIsDeleteOpen(false);
    } catch {
      toast.error("Failed to delete task");
      setIsDeleting(false);
    }
  };

  const cardInner = (
    <div
      className={cn(
        "relative flex flex-col rounded-xl p-3",
        isKanban
          ? "gap-1.5 border border-[#ebebeb] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          : "gap-2",
      )}
      style={isKanban ? undefined : { background: "white", boxShadow: TASK_CARD_SHADOW }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <TruncatedText className={titleClass}>{task.title}</TruncatedText>
          {isKanban && showClientAvatar ? (
            <TruncatedText
              asChild
              className="max-w-full text-[11px] font-medium leading-4 text-[#a3a3a3] transition-colors hover:text-[#335cff]"
            >
              <Link
                href={applicationHref}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="rounded-sm underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#335cff]/25"
              >
                {clientName}
              </Link>
            </TruncatedText>
          ) : null}
          {task.description ? (
            isKanban ? (
              <p className={descClass}>{task.description}</p>
            ) : (
              <TruncatedText className={descClass}>{task.description}</TruncatedText>
            )
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {!hideStatusBadge && <TaskStatusBadge status={task.status} />}
          {!isClientView && (
            <CardActionSlot visible={hovered}>
              <div className="flex items-center">
                <button
                  type="button"
                  aria-label={`Edit ${task.title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditOpenChange(true);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="flex size-7 items-center justify-center transition-transform duration-75 focus-visible:outline-none active:scale-[0.96]"
                  tabIndex={hovered ? 0 : -1}
                >
                  <Icon
                    icon="mingcute:pencil-line"
                    width={20}
                    height={20}
                    className="text-[#A4A4A4] transition-colors duration-150 hover:text-[#5c5c5c]"
                  />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${task.title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteOpen(true);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="flex size-7 items-center justify-center transition-transform duration-75 focus-visible:outline-none active:scale-[0.96]"
                  tabIndex={hovered ? 0 : -1}
                >
                  <Icon
                    icon="mingcute:delete-2-line"
                    width={20}
                    height={20}
                    className="text-[#A4A4A4] transition-colors duration-150 hover:text-red-500"
                  />
                </button>
              </div>
            </CardActionSlot>
          )}
        </div>
      </div>

      {isKanban ? (
        <KanbanCardFooter
          task={task}
          showClientAvatar={showClientAvatar}
          clientName={clientName}
          clientAvatarSrc={clientAvatarSrc}
          createdByName={createdByName}
          createdByAvatarSrc={createdByAvatarSrc}
          applicationHref={applicationHref}
        />
      ) : (
        <>
          <MetaRow
            icon="mingcute:calendar-2-line"
            label="When"
            delay={rowBaseDelay + 0.08}
            disableAnimations={disableAnimations}
          >
            <TruncatedText
              className={`max-w-[200px] ${valueCls} select-none text-right tabular-nums`}
            >
              {whenLabel}
            </TruncatedText>
          </MetaRow>

          {task.meetingLink ? (
            <MetaRow
              icon="mingcute:link-2-line"
              label="Meeting link"
              delay={rowBaseDelay + 0.14}
              disableAnimations={disableAnimations}
            >
              <TruncatedText
                asChild
                className="max-w-[180px] text-[14px] font-medium leading-5 tracking-[-0.084px] text-[#335cff]"
              >
                <a
                  href={normalizeMeetingUrl(task.meetingLink)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline-offset-2 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {task.meetingLink}
                </a>
              </TruncatedText>
            </MetaRow>
          ) : null}
        </>
      )}
    </div>
  );

  return (
    <>
      {disableAnimations ? (
        <div className="w-full">{cardInner}</div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={
            isKanban && !reduced ? { y: -2, boxShadow: "0 4px 12px rgba(15,23,42,0.08)" } : undefined
          }
          transition={
            reduced
              ? { duration: 0.15 }
              : { ...SPRING_OUTCOME, delay: Math.min(index * 0.06, 0.24) }
          }
          className="w-full"
        >
          {cardInner}
        </motion.div>
      )}

      {!isClientView && (
        <ConfirmationModal
          open={isDeleteOpen}
          onOpenChange={(open) => {
            setIsDeleteOpen(open);
            if (!open) setIsDeleting(false);
          }}
          onConfirm={handleDelete}
          title="Delete task?"
          description={
            <>
              This will permanently remove{" "}
              <span className="font-medium text-foreground">{task.title}</span>{" "}
              from this application. This action cannot be undone.
            </>
          }
          confirmText="Delete task"
          isLoading={isDeleting}
          variant="destructive"
        />
      )}

      {!isClientView && (
        <Dialog open={isEditOpen} onOpenChange={handleEditOpenChange}>
          <DialogContent
            showCloseButton={false}
            className="w-[min(100vw-2rem,400px)] max-w-[400px] gap-0 overflow-visible border-0 bg-transparent p-0 shadow-none sm:max-w-[400px]"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest('[role="toolbar"]')) {
                e.preventDefault();
              }
            }}
          >
            <DialogTitle className="sr-only">Edit task</DialogTitle>
            <AddTaskPopover
              key={`${task.id}-${editSession}`}
              mode="edit"
              initialValues={taskToFormData(task)}
              applicationId={task.applicationId}
              onClose={() => setIsEditOpen(false)}
              onSave={handleSave}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
