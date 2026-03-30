"use client";

import { Bell, Mail, MailOpen, PenSquare, Send } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import type { EmailHistoryCategory } from "@/types/email";

interface EmailHistorySidebarProps {
  selectedCategory: EmailHistoryCategory;
  onCategorySelect: (category: EmailHistoryCategory) => void;
  onCompose: () => void;
}

interface SidebarButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  bgColor: string;
}

const buttonVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.01 },
  tap: { scale: 0.99 },
};

const iconVariants = {
  initial: { rotate: 0 },
  hover: { rotate: 5 },
};

const CATEGORIES: {
  id: EmailHistoryCategory;
  label: string;
  Icon: React.ElementType;
  bgColor: string;
  iconClass: string;
}[] = [
  { id: "all", label: "All", Icon: Mail, bgColor: "bg-blue-50", iconClass: "text-blue-700" },
  { id: "received", label: "Received", Icon: Mail, bgColor: "bg-sky-50", iconClass: "text-sky-700" },
  { id: "sent", label: "Sent", Icon: Send, bgColor: "bg-green-50", iconClass: "text-green-700" },
  { id: "system", label: "System", Icon: Bell, bgColor: "bg-purple-50", iconClass: "text-purple-700" },
];

function SidebarButton({ icon, label, onClick, isActive, bgColor }: SidebarButtonProps) {
  return (
    <motion.button
      variants={buttonVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-xl border border-transparent p-1.5 transition-colors hover:cursor-pointer hover:bg-gray-100 ${
        isActive ? "border-[#EEEFF1]! bg-gray-50" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <motion.div variants={iconVariants} className={`rounded-lg p-[5px] ${bgColor}`}>
          {icon}
        </motion.div>
        <span className="text-label-sm text-strong">{label}</span>
      </div>
    </motion.button>
  );
}

export function EmailHistorySidebar({ selectedCategory, onCategorySelect, onCompose }: EmailHistorySidebarProps) {
  const router = useRouter();

  return (
    <div className="flex h-full w-[200px] shrink-0 flex-col border-r p-2">
      {/* Compose — above categories */}
      <SidebarButton
        icon={<PenSquare className="h-3 w-3 text-primary" />}
        label="Compose Email"
        onClick={onCompose}
        bgColor="bg-primary-alpha-10"
      />

      <div className="my-2 px-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Categories</span>
      </div>

      <div className="flex flex-col gap-1">
        {CATEGORIES.map(({ id, label, Icon, bgColor, iconClass }) => (
          <SidebarButton
            key={id}
            icon={<Icon className={`h-3 w-3 ${iconClass}`} />}
            label={label}
            onClick={() => onCategorySelect(id)}
            isActive={selectedCategory === id}
            bgColor={bgColor}
          />
        ))}
      </div>

      {/* Bottom — Email page card */}
      <div className="mt-auto p-1">
        <motion.div
          variants={buttonVariants}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
          className="flex flex-col items-start rounded-xl border border-gray-200 bg-white p-3 hover:cursor-pointer"
          onClick={() => router.push("/v2/mail")}
        >
          <div className="mb-1 flex items-center gap-1.5">
            <motion.div variants={iconVariants} className="rounded-lg bg-gray-50 p-1.5">
              <MailOpen className="h-3 w-3 text-gray-700" />
            </motion.div>
            <span className="text-sm font-medium">Email Page</span>
          </div>
          <p className="text-sm text-gray-500">Open the full email inbox</p>
        </motion.div>
      </div>
    </div>
  );
}
