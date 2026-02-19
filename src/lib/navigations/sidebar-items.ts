import {
    Banknote,
    Bell,
    Calendar,
    ChartBar,
    ClipboardList,
    FileText,
    Fingerprint,
    Forklift,
    Gauge,
    GraduationCap,
    Kanban,
    LayoutDashboard,
    Lock,
    type LucideIcon,
    Mail,
    MessageSquare,
    ReceiptText,
    ShoppingBag,
    SquareArrowUpRight,
    Users,
} from "lucide-react";

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
            },
            {
                title: "Checklist Requests",
                url: "/v2/checklist-requests",
                icon: ClipboardList,
                comingSoon: false,
            },
            {
                title: "Notifications",
                url: "/v2/notifications",
                icon: Bell,
                comingSoon: false,
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
            },
            {
                title: "Email",
                url: "/dashboard/coming-soon",
                icon: Mail,
                comingSoon: true,
            },
            {
                title: "Chat",
                url: "/dashboard/coming-soon",
                icon: MessageSquare,
                comingSoon: true,
            },
            // {
            //   title: "Calendar",
            //   url: "/dashboard/coming-soon",
            //   icon: Calendar,
            //   comingSoon: true,
            // },
            // {
            //   title: "Kanban",
            //   url: "/dashboard/coming-soon",
            //   icon: Kanban,
            //   comingSoon: true,
            // },
            // {
            //   title: "Invoice",
            //   url: "/dashboard/coming-soon",
            //   icon: ReceiptText,
            //   comingSoon: true,
            // },
            // {
            //   title: "Roles",
            //   url: "/dashboard/coming-soon",
            //   icon: Lock,
            //   comingSoon: true,
            // },

        ],
    },
    // {
    //   id: 3,
    //   label: "Misc",
    //   items: [
    //     {
    //       title: "Others",
    //       url: "/dashboard/coming-soon",
    //       icon: SquareArrowUpRight,
    //       comingSoon: true,
    //     },
    //   ],
    // },
];