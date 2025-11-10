import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,

} from "@/components/ui/sidebar";

import { Outlet } from "react-router";
import { Bell, User } from "lucide-react";
import { AppSidebar } from "../shared/AppSidebar";
import { useGlobalDriverSocket } from "@/hooks/useGlobalDriverSocket";

export default function DashboardLayout() {
  
  
  
    useGlobalDriverSocket();
  
  
  return (
    <SidebarProvider>
      {/* Sidebar */}
      <AppSidebar />

      {/* Main Content */}
      <SidebarInset className="flex flex-col w-full min-h-screen bg-muted/30">

        {/* Navbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-6 bg-white">

          <SidebarTrigger className="-ml-1" />
          {/* Right Side: Navbar actions */}
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-lg hover:bg-muted">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-full hover:bg-muted">
              <User className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
