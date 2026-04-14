import {
    ClipboardList,
    FileText,
    Fingerprint,
    Forklift,
    LayoutDashboard,
    type LucideIcon,
    Mail,
    MessageSquare,
    Phone,
    ShieldCheck,
    Users,
} from "lucide-react";
import { ROLES } from "@/lib/roles";
import { ROUTES } from "@/utils/routes";

export interface NavSubItem {
    title: string;
    url: string;
    icon?: LucideIcon;
    comingSoon?: boolean;
    newTab?: boolean;
    isNew?: boolean;
}

export interface NavMainItem {
    title: string;
    url: string;
    icon?: LucideIcon;
    subItems?: NavSubItem[];
    comingSoon?: boolean;
    newTab?: boolean;
    isNew?: boolean;
    allowedRoles?: string[];
}

export interface NavGroup {
    id: number;
    label?: string;
    items: NavMainItem[];
}

export const sidebarItems: NavGroup[] = [
    {
        id: 1,
        label: "Dashboards",
        items: [
            {
                title: "Admin Dashboard",
                url: "/v2",
                icon: LayoutDashboard,
                allowedRoles: [ROLES.MASTER_ADMIN],
            },
        ],
    },
    {
        id: 2,
        label: "Pages",
        items: [
            {
                title: "Applications",
                url: "/v2/applications",
                icon: Fingerprint,
                subItems: [
                    { title: "Visa Applications", url: "/v2/applications", newTab: false },
                    { title: "Spouse Skill Assessment Applications", url: "/v2/spouse-skill-assessment-applications", newTab: false },
                ],
            },
            {
                title: "Requested Docs",
                url: "/v2/requested-docs",
                icon: FileText,
                comingSoon: false,
            },
            {
                title: "Quality Check",
                url: "/v2/quality-check",
                icon: Forklift,
                comingSoon: false,
                allowedRoles: [ROLES.MASTER_ADMIN, ROLES.TEAM_LEADER, ROLES.SUPERVISOR],
            },
            {
                title: "Approval Requests",
                url: ROUTES.APPROVAL_REQUESTS,
                icon: ShieldCheck,
                comingSoon: false,
                allowedRoles: [ROLES.MASTER_ADMIN],
            },
            {
                title: "Users",
                url: "/v2/users",
                icon: Users,
                subItems: [
                    { title: "Manage Admins", url: "/v2/users", newTab: false },
                    { title: "Manage Clients", url: "/v2/clients", newTab: false },
                ],
                comingSoon: false,
                allowedRoles: [ROLES.MASTER_ADMIN],
            },
        ],
    },
    {
        id: 3,
        label: "Communication",
        items: [
            {
                title: "Email",
                url: "/v2/mail",
                icon: Mail,
                comingSoon: false,
                isNew: false,
                allowedRoles: [ROLES.MASTER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEADER, ROLES.SUPERVISOR],
            },
            {
                title: "Chat",
                url: "/v2/messages",
                icon: MessageSquare,
                comingSoon: false,
                isNew: false,
                allowedRoles: [ROLES.MASTER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEADER, ROLES.SUPERVISOR],
            },
            {
                title: "Call Logs",
                url: ROUTES.CALL_LOGS,
                icon: Phone,
                comingSoon: false,
                allowedRoles: [ROLES.MASTER_ADMIN, ROLES.ADMIN, ROLES.TEAM_LEADER, ROLES.SUPERVISOR],
            },
        ],
    },
];

const CHECKLIST_ITEM_TITLES = new Set(["Checklist", "Checklist Requests"]);

function buildChecklistNavItemsForRole(role?: string): NavMainItem[] {
    if (role === ROLES.MASTER_ADMIN) {
        return [
            {
                title: "Checklist",
                url: ROUTES.CHECKLIST_REQUESTS,
                icon: ClipboardList,
                subItems: [
                    { title: "Manage Checklist Docs", url: ROUTES.CHECKLIST_DOCS, newTab: false },
                    { title: "Checklist Requests", url: ROUTES.CHECKLIST_REQUESTS, newTab: false },
                ],
                allowedRoles: [ROLES.MASTER_ADMIN],
            },
        ];
    }

    return [
        {
            title: "Checklist Requests",
            url: ROUTES.CHECKLIST_REQUESTS,
            icon: ClipboardList,
            comingSoon: false,
            allowedRoles: [ROLES.ADMIN, ROLES.TEAM_LEADER],
        },
    ];
}


export function getFilteredSidebarItems(role?: string): NavGroup[] {
    return sidebarItems
        .map((group) => {
            const filteredItems = group.items.filter(
                (item) =>
                    !item.allowedRoles ||
                    (role !== undefined && item.allowedRoles.includes(role)),
            );

            if (group.id !== 2) {
                return { ...group, items: filteredItems };
            }

            const withoutChecklist = filteredItems.filter(
                (item) => !CHECKLIST_ITEM_TITLES.has(item.title),
            );

            const checklistIndex = filteredItems.findIndex((item) =>
                CHECKLIST_ITEM_TITLES.has(item.title),
            );
            const insertAt = checklistIndex === -1 ? withoutChecklist.length : checklistIndex;

            const checklistItems = buildChecklistNavItemsForRole(role).filter(
                (item) =>
                    !item.allowedRoles ||
                    (role !== undefined && item.allowedRoles.includes(role)),
            );

            const items = [
                ...withoutChecklist.slice(0, insertAt),
                ...checklistItems,
                ...withoutChecklist.slice(insertAt),
            ];

            return { ...group, items };
        })
        .filter((group) => group.items.length > 0);
}