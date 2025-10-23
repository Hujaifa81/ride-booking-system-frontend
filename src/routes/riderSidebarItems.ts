import RideRequest from "@/components/modules/rider/RideRequest";
import BeADriver from "@/pages/BeADriver";
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
        title: "Bookings",
        url: "/rider/bookings",
        // component: Bookings,
      },
      {
        title: "Payments",
        url: "/rider/payments",
        // component: Payments,
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        title: "Notifications",
        url: "/rider/notifications",
        // component: Notifications,
      },
      {
        title: "Be A Driver",
        url: "/rider/be-a-driver",
        component: BeADriver
      },
      {
        title: "Settings",
        url: "/rider/settings",
        // component: Settings,
      },
    ],
  },
];
