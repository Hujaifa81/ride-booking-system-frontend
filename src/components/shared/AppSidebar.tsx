import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router";
import { cn } from "@/lib/utils";
import { getSidebarItems } from "@/utils/getSidebarItems";
import { useUserInfoQuery } from "@/redux/features/auth/auth.api";

export function AppSidebar() {
  const { data: userData } = useUserInfoQuery(undefined);
  const sidebarSections = getSidebarItems(userData?.data?.role);

  const location = useLocation();

  return (
    <Sidebar>
      <SidebarContent>
        {sidebarSections.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={active}>
                        <Link
                          to={item.url}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium",
                            active ? "text-primary bg-muted" : "text-foreground hover:bg-muted"
                          )}
                        >
                          {item.title}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
