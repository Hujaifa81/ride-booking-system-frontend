
import DriverActiveRidePage from "@/pages/DriverActiveRidePage";
import DriverDashboardPage from "@/pages/DriverDashboardPage";
import EarningsAnalyticsPage from "@/pages/EarningsAnalyticsPage";
import IncomingRequestsPage from "@/pages/IncomingRequestsPage";
import ProfilePage from "@/pages/ProfilePage";
import RideHistoryPage from "@/pages/RideHistoryPage";
import VehicleManagementPage from "@/pages/VehicleManagementPage";
import type { ISidebarItem } from "@/types";

export const driverSidebarItems: ISidebarItem[] = [
  {
    title: "Main",
    items: [
      {
        title: "My Dashboard",
        url: "/driver/dashboard",
        component: DriverDashboardPage,
      },
      {
        title: "Incoming Request",
        url: "/driver/incoming-request",
        component: IncomingRequestsPage,
      },
      {
        title: "Active Ride",
        url: "/driver/active-ride",
        component: DriverActiveRidePage,
      },
      {
        title: "Vehicle Management",
        url: "/driver/vehicle-management",
        component: VehicleManagementPage,
      },
      {
        title: "Earnings",
        url: "/driver/earnings",
        component: EarningsAnalyticsPage,
      }
    ],
  },
  {
    title: "History",
    items: [
      {
        title: "Ride History",
        url: "/driver/ride-history",
        component: RideHistoryPage,
      },
      
    ],
  },
  {
    title: "Account",
    items: [
      {
        title: "Profile",
        url: "/driver/profile",
        component: ProfilePage,
      },
    //   {
    //     title: "",
    //     url: "/rider/be-a-driver",
    //     component: BeADriver
    //   },
      
    ],
  },
];