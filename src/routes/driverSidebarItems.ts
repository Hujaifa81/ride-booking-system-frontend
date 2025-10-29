
import DriverDashboardPage from "@/pages/DriverDashboardPage";
import ProfilePage from "@/pages/ProfilePage";
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
        title: "Ride Request",
        url: "/driver/incoming-request",
        // component: RideRequest,
      },
      {
        title: "Active Ride",
        url: "/driver/active-ride",
        // component: ActiveRide,
      },
      {
        title: "Vehicle Management",
        url: "/driver/vehicle-management",
        component: VehicleManagementPage,
      },
    ],
  },
  {
    title: "History",
    items: [
      {
        title: "Ride History",
        url: "/driver/ride-history",
        // component: RideHistoryPage,
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