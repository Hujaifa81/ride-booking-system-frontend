import RideRequest from "@/components/modules/rider/RideRequest";
import BeADriver from "@/pages/BeADriver";
import ProfilePage from "@/pages/ProfilePage";
import RideHistoryPage from "@/pages/RideHistoryPage";
import ActiveRide from "@/pages/RiderActiveRide";
import RiderDashboard from "@/pages/RiderDashboard";
import type { ISidebarItem } from "@/types";




export const riderSidebarItems: ISidebarItem[] = [
  {
    title: "Main",
    items: [
      {
        title: "My Dashboard",
        url: "/rider/dashboard",
        component: RiderDashboard,
      },
      {
        title: "Ride Request",
        url: "/rider/ride-request",
        component: RideRequest,
      },
      {
        title: "Active Ride",
        url: "/rider/active-ride",
        component: ActiveRide,
      },
    ],
  },
  {
    title: "History",
    items: [
      {
        title: "Ride History",
        url: "/rider/ride-history",
        component: RideHistoryPage,
      },
      
    ],
  },
  {
    title: "Account",
    items: [
      {
        title: "Profile",
        url: "/rider/profile",
        component: ProfilePage,
      },
      {
        title: "Become a Driver",
        url: "/rider/be-a-driver",
        component: BeADriver
      },
      
    ],
  },
];
