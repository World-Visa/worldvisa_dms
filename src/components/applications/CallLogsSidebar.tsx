"use client";

import { PhoneIncoming, PhoneOutgoing, Phone } from "lucide-react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";

type CallLogsCategory = "all" | "inbound" | "outbound";

interface CallLogsSidebarProps {
  selectedCategory: CallLogsCategory;
  onCategorySelect: (category: CallLogsCategory) => void;
  callLogsPageHref?: string;
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
  id: CallLogsCategory;
  label: string;
  Icon: React.ElementType;
  bgColor: string;
  iconClass: string;
}[] = [
  { id: "all", label: "All Calls", Icon: Phone, bgColor: "bg-blue-50", iconClass: "text-blue-700" },
  { id: "inbound", label: "Incoming", Icon: PhoneIncoming, bgColor: "bg-emerald-50", iconClass: "text-emerald-700" },
  { id: "outbound", label: "Outgoing", Icon: PhoneOutgoing, bgColor: "bg-indigo-50", iconClass: "text-indigo-700" },
];

function SidebarButton({
  icon,
  label,
  onClick,
  isActive,
  bgColor,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  bgColor: string;
}) {
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

export function CallLogsSidebar({
  selectedCategory,
  onCategorySelect,
  callLogsPageHref = "/v2/call-logs",
}: CallLogsSidebarProps) {
  const router = useRouter();

  return (
    <div className="flex h-full w-[200px] shrink-0 flex-col border-r p-2">
      <div className="my-1 px-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Calls</span>
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

      <div className="mt-auto p-1">
        <motion.div
          variants={buttonVariants}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
          className="flex flex-col items-start rounded-xl border border-gray-200 bg-white p-3 hover:cursor-pointer"
          onClick={() => router.push(callLogsPageHref)}
        >
          <div className="mb-1 flex items-center gap-1.5">
            <motion.div variants={iconVariants} className="rounded-lg bg-gray-50 p-1.5">
              <Phone className="h-3 w-3 text-gray-700" />
            </motion.div>
            <span className="text-sm font-medium">Call Logs Page</span>
          </div>
          <p className="text-sm text-gray-500">Open the full call logs view</p>
        </motion.div>
      </div>
    </div>
  );
}

export type { CallLogsCategory };

