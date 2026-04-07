"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useUserDetails } from "@/hooks/useUserDetails";
import { getFilteredSidebarItems } from "@/lib/navigations/sidebar-items";
import { formatRole, getAvatarUrl } from "@/lib/utils";

import { NavMain } from "@/components/v2/sidebar/nav-main";
import { NavUser } from "@/components/v2/sidebar/nav-user";
import Image from "next/image";
import Logo from "../../../../public/logos/world-visa-logo.webp";
import { Suspense } from "react";


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const { data: profileData } = useUserDetails(user?._id ?? "");

  const filteredItems = getFilteredSidebarItems(user?.role);

  const navUser = {
    name: user?.username ?? "",
    email: user?.email ?? "",
    avatar: profileData?.data?.user?.profile_image_url ?? (user?._id ? getAvatarUrl(user._id) : ""),
    role: user?.role ? formatRole(user.role) : "",
  };

  return (
    <Sidebar {...props} variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <div className="flex items-center gap-2">
                <div className="relative h-12 w-36 group-data-[collapsible=icon]:hidden">
                  <Image
                    src={Logo}
                    alt="WorldVisa Logo"
                    height={72}
                    width={120}
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>
                <div className="hidden h-8 w-8 shrink-0 items-center justify-center group-data-[collapsible=icon]:flex">
                  <Image
                    src="https://res.cloudinary.com/djvvz62dw/image/upload/v1724397846/worldvisa/Images/world-visa-logo_rqnb93.png"
                    alt="WorldVisa Logo"
                    width={32}
                    height={32}
                    className="object-contain"
                  />
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <Suspense fallback={null}>
          <NavMain items={filteredItems} />
        </Suspense>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={navUser} />
      </SidebarFooter>
    </Sidebar>
  );
}