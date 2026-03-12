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
            <nav className="grid gap-1 px-2 font-medium group-data-[collapsed=true]:justify-center group-data-[collapsed=true]:px-2">
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
                                        "h-9 w-9"
                                    )}>
                                    {link.dot ?? <link.icon className="size-4" />}
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
                                "justify-start"
                            )}>
                            {link.dot ?? <link.icon className="mr-2 h-4 w-4" />}
                            {link.title}
                            {link.label && (
                                <span className="ml-auto">
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
