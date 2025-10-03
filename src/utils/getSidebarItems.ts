import { role } from "@/constants/role";
import { riderSidebarItems } from "@/routes/riderSidebarItems";
import type { TRole } from "@/types";

export const getSidebarItems = (userRole: TRole) => {
  switch (userRole) {
    // case role.admin:
    //   return [...adminSidebarItems];
    // case role.driver:
    //   return [...driverSidebarItems];
    case role.rider:
      return [...riderSidebarItems];
    default:
      return [];
  }
};