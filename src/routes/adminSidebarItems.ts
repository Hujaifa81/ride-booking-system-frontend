
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import ProfilePage from "@/pages/ProfilePage";
import type { ISidebarItem } from "@/types";

export const adminSidebarItems: ISidebarItem[] = [
  {
    title: "Main",
    items: [
      {
        title: "Dashboard",
        url: "/admin/dashboard",
        component: AdminDashboardPage,
      },
      {
        title: "Analytics",
        url: "/admin/analytics",
        // component: AnalyticsPage,
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        title: "User Management",
        url: "/admin/user-management",
        // component: UserManagementPage,
      },
      {
        title: "Ride Management",
        url: "/admin/ride-management",
        // component: RideManagementPage,
      },
      {
        title: "Vehicle Management",
        url: "/admin/vehicle-management",
        // component: VehicleManagementPage,
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        title: "Profile",
        url: "/admin/profile",
        component: ProfilePage,
      },
    ],
  },
];