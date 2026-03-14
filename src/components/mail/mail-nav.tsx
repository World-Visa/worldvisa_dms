"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon, MailPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMailStore } from "@/store/mailStore";

interface MailNavProps {
    isCollapsed: boolean;
    links: {
        title: string;
        label?: string;
        icon: LucideIcon;
        dot?: ReactNode;
        href: string;
        variant: "default" | "ghost" | "secondary";
    }[];
}

export function MailNav({ links, isCollapsed }: MailNavProps) {
    const pathname = usePathname();
    const { openCompose } = useMailStore();

    return (
        <div
            data-collapsed={isCollapsed}
            className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2">
            <div className="px-3">
                {isCollapsed ? (
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={openCompose}
                                variant="secondary"
                                size="icon"
                                className="h-9 w-9">
                                <MailPlus className="h-4 w-4" />
                                <span className="sr-only">Compose mail</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Compose mail</TooltipContent>
                    </Tooltip>
                ) : (
                    <Button
                        onClick={openCompose}
                        variant="secondary"
                        className="w-full rounded-md justify-center h-11 text-base font-medium">
                        <MailPlus className="w-5 h-5" />
                        <span className="text-base tracking-tight font-medium">Compose mail</span>
                    </Button>
                )}
            </div>
            <nav className="grid gap-0.5 px-2 font-medium group-data-[collapsed=true]:justify-center group-data-[collapsed=true]:px-2">
                {links.map((link, index) => {
                    const isActive = pathname.startsWith(link.href);
                    const variant = isActive ? "secondary" : "ghost";

                    return isCollapsed ? (
                        <Tooltip key={index} delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Link
                                    href={link.href}
                                    className={cn(
                                        buttonVariants({ variant, size: "icon" }),
                                        "h-9 w-9 relative"
                                    )}>
                                    {link.dot ?? <link.icon className="size-4" />}
                                    {link.label && (
                                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
                                            {link.label}
                                        </span>
                                    )}
                                    <span className="sr-only">{link.title}</span>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="flex items-center gap-4">
                                {link.title}
                                {link.label && <span className="text-muted-foreground ml-auto">{link.label}</span>}
                            </TooltipContent>
                        </Tooltip>
                    ) : (
                        <Link
                            key={index}
                            href={link.href}
                            className={cn(
                                buttonVariants({ variant, size: "sm" }),
                                "justify-start h-9 px-3 gap-2.5",
                                isActive && "font-semibold"
                            )}>
                            {link.dot ?? <link.icon className="h-4 w-4 shrink-0" />}
                            <span className="truncate">{link.title}</span>
                            {link.label && (
                                <span className={cn(
                                    "ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium leading-none tabular-nums",
                                    isActive
                                        ? "bg-primary/15 text-primary"
                                        : "bg-muted text-muted-foreground"
                                )}>
                                    {link.label}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
