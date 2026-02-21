"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  FileSearch,
  Loader2,
  Search,
  ShieldCheck,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { cn } from "@/lib/utils";
import type {
  ChecklistRequestedItem,
  GlobalSearchApplication,
  QualityCheckItem,
  RequestedReviewItem,
} from "@/lib/api/globalSearch";
import { getFilteredSidebarItems } from "@/lib/navigations/sidebar-items";

function StatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase();
  const colorMap: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-green-50 text-green-700 border-green-200",
    rejected: "bg-red-50 text-red-700 border-red-200",
    completed: "bg-blue-50 text-blue-700 border-blue-200",
    active: "bg-sky-50 text-sky-700 border-sky-200",
  };
  const color =
    Object.entries(colorMap).find(([key]) => lower.includes(key))?.[1] ??
    "bg-muted text-muted-foreground border-border";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium",
        color,
      )}
    >
      {status}
    </span>
  );
}

function ResultIcon({
  children,
  colorClass,
}: {
  children: React.ReactNode;
  colorClass: string;
}) {
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full ring-1",
        colorClass,
      )}
    >
      {children}
    </span>
  );
}

type DefaultNavItem = {
  group: string;
  label: string;
  url: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled: boolean;
};

export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [country, setCountry] = React.useState<"Australia" | "Canada">(
    "Australia",
  );
  const router = useRouter();
  const { user } = useAuth();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      setInputValue("");
    }
  };

  const isSearching = inputValue.trim().length >= 2;
  const { data, isLoading, isFetching } = useGlobalSearch(inputValue, country);
  const searchData = data?.data;

  const hasApplications = (searchData?.applications?.length ?? 0) > 0;
  const hasReviews = (searchData?.requestedReview?.length ?? 0) > 0;
  const hasChecklist = (searchData?.checklistRequested?.length ?? 0) > 0;
  const hasQualityCheck = (searchData?.qualityCheck?.length ?? 0) > 0;
  const hasAnyResults =
    hasApplications || hasReviews || hasChecklist || hasQualityCheck;

  const navigate = (path: string) => {
    router.push(path);
    handleOpenChange(false);
  };

  const handleApplicationSelect = (app: GlobalSearchApplication) => {
    const path =
      app.Record_Type === "spouse_skill_assessment"
        ? `/v2/spouse-skill-assessment-applications/${app.id}`
        : `/v2/applications/${app.id}`;
    navigate(path);
  };

  const handleReviewSelect = (_item: RequestedReviewItem) => {
    navigate("/v2/requested-docs");
  };

  const handleQualityCheckSelect = (_item: QualityCheckItem) => {
    navigate("/v2/quality-check");
  };

  const handleChecklistSelect = (_item: ChecklistRequestedItem) => {
    navigate("/v2/checklist-requests");
  };

  // Build flat nav items from role-filtered sidebar items for the default (no-search) view
  const navGroups = getFilteredSidebarItems(user?.role);
  const defaultNavItems: DefaultNavItem[] = navGroups.flatMap((group) =>
    group.items.flatMap((item) =>
      item.subItems
        ? item.subItems.map((sub) => ({
            group: group.label ?? "Pages",
            label: sub.title,
            url: sub.url,
            icon: item.icon,
            disabled: sub.comingSoon ?? item.comingSoon ?? false,
          }))
        : [
            {
              group: group.label ?? "Pages",
              label: item.title,
              url: item.url,
              icon: item.icon,
              disabled: item.comingSoon ?? false,
            },
          ],
    ),
  );
  const defaultGroups = [...new Set(defaultNavItems.map((item) => item.group))];

  return (
    <>
      <Button
        variant="link"
        className="!px-0 font-normal text-muted-foreground hover:no-underline"
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" />
        Search
        <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-medium text-[10px]">
          <span className="text-xs">⌘</span>J
        </kbd>
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogHeader className="sr-only">
          <DialogTitle>Global Search</DialogTitle>
          <DialogDescription>
            Search applications, documents, and more
          </DialogDescription>
        </DialogHeader>
        <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
          <Command
            shouldFilter={!isSearching}
            className="**:[[cmdk-group-heading]]:text-muted-foreground **:data-[slot=command-input-wrapper]:h-12 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 **:[[cmdk-input]]:h-12 **:[[cmdk-item]]:px-2 **:[[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5"
          >
            <CommandInput
              placeholder="Search applications, documents…"
              value={inputValue}
              onValueChange={setInputValue}
            />

            {/* Country toggle */}
            <div className="flex items-center gap-1.5 border-b px-3 py-2">
              <span className="text-xs text-muted-foreground">Country:</span>
              <button
                type="button"
                onClick={() => setCountry("Australia")}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                  country === "Australia"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                AU
              </button>
              <button
                type="button"
                onClick={() => setCountry("Canada")}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                  country === "Canada"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                CA
              </button>
              {(isLoading || isFetching) && isSearching && (
                <Loader2 className="ml-auto size-3.5 animate-spin text-muted-foreground" />
              )}
            </div>

            <CommandList className="max-h-[380px]">
              {/* Default state: role-filtered navigation items */}
              {!isSearching &&
                defaultGroups.map((group, i) => (
                  <React.Fragment key={group}>
                    {i !== 0 && <CommandSeparator />}
                    <CommandGroup heading={group}>
                      {defaultNavItems
                        .filter((item) => item.group === group)
                        .map((item) => (
                          <CommandItem
                            className="py-1.5!"
                            key={item.label}
                            value={item.label}
                            disabled={item.disabled}
                            onSelect={() =>
                              !item.disabled && navigate(item.url)
                            }
                          >
                            {item.icon && <item.icon className="size-4" />}
                            <span>{item.label}</span>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </React.Fragment>
                ))}

              {/* Search results */}
              {isSearching && !isLoading && !hasAnyResults && (
                <CommandEmpty>No results found for "{inputValue}"</CommandEmpty>
              )}

              {isSearching && hasApplications && (
                <CommandGroup heading="Applications">
                  {searchData?.applications.map((app) => (
                    <CommandItem
                      key={app.id}
                      value={`app-${app.id}`}
                      onSelect={() => handleApplicationSelect(app)}
                      className="flex items-center gap-3"
                    >
                      <ResultIcon colorClass="bg-blue-50 text-blue-600 ring-blue-200">
                        <User className="size-3.5" />
                      </ResultIcon>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-sm font-medium">
                          {app.Name}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {app.Email}
                          {app.Phone ? ` · ${app.Phone}` : ""}
                        </span>
                      </div>
                      {app.DMS_Application_Status && (
                        <StatusBadge status={app.DMS_Application_Status} />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {isSearching && hasReviews && (
                <>
                  {hasApplications && <CommandSeparator />}
                  <CommandGroup heading="Requested Review">
                    {searchData?.requestedReview.map((item) => (
                      <CommandItem
                        key={`${item._id}-${item.requested_review._id}`}
                        value={`review-${item._id}-${item.requested_review._id}`}
                        onSelect={() => handleReviewSelect(item)}
                        className="flex items-center gap-3"
                      >
                        <ResultIcon colorClass="bg-amber-50 text-amber-600 ring-amber-200">
                          <FileSearch className="size-3.5" />
                        </ResultIcon>
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="truncate text-sm font-medium">
                            {item.client_name}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {item.document_name}
                            {item.document_category
                              ? ` · ${item.document_category}`
                              : ""}
                          </span>
                        </div>
                        {item.requested_review?.status && (
                          <StatusBadge status={item.requested_review.status} />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {isSearching && hasQualityCheck && (
                <>
                  {(hasApplications || hasReviews) && <CommandSeparator />}
                  <CommandGroup heading="Quality Check">
                    {searchData?.qualityCheck.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={`qc-${item.id}`}
                        onSelect={() => handleQualityCheckSelect(item)}
                        className="flex items-center gap-3"
                      >
                        <ResultIcon colorClass="bg-sky-50 text-sky-600 ring-sky-200">
                          <ShieldCheck className="size-3.5" />
                        </ResultIcon>
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="truncate text-sm font-medium">
                            {item.Name}
                          </span>
                          {item.Email && (
                            <span className="truncate text-xs text-muted-foreground">
                              {item.Email}
                            </span>
                          )}
                        </div>
                        {item.DMS_Application_Status && (
                          <StatusBadge status={item.DMS_Application_Status} />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}

              {isSearching && hasChecklist && (
                <>
                  {(hasApplications || hasReviews || hasQualityCheck) && (
                    <CommandSeparator />
                  )}
                  <CommandGroup heading="Checklist Requested">
                    {searchData?.checklistRequested.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={`cl-${item.id}`}
                        onSelect={() => handleChecklistSelect(item)}
                        className="flex items-center gap-3"
                      >
                        <ResultIcon colorClass="bg-emerald-50 text-emerald-600 ring-emerald-200">
                          <ClipboardList className="size-3.5" />
                        </ResultIcon>
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="truncate text-sm font-medium">
                            {item.Name}
                          </span>
                          {item.Email && (
                            <span className="truncate text-xs text-muted-foreground">
                              {item.Email}
                            </span>
                          )}
                        </div>
                        {item.DMS_Application_Status && (
                          <StatusBadge status={item.DMS_Application_Status} />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
