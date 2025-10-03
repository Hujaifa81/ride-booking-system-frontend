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
        title: "New Booking",
        url: "/rider/new-booking",
        // component: NewBooking,
      },
      {
        title: "Active Booking",
        url: "/rider/active-booking",
        // component: ActiveBooking,
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
        title: "Support",
        url: "/rider/support",
        // component: Support,
      },
      {
        title: "Settings",
        url: "/rider/settings",
        // component: Settings,
      },
    ],
  },
];
