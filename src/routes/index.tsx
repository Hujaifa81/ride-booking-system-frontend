import App from "@/App";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { role } from "@/constants/role";
import Homepage from "@/pages/Homepage";
import Signin from "@/pages/Signin";
import SignUp from "@/pages/SignUp";
import type { TRole } from "@/types";
import { withAuth } from "@/utils/withAuth";
import { createBrowserRouter, Navigate } from "react-router";
import { riderSidebarItems } from "./riderSidebarItems";
import { generateRoutes } from "@/utils/generateRoutes";
import { driverSidebarItems } from "./driverSidebarItems";


export const router = createBrowserRouter([
    {
        Component: App,
        path: "/",
        children: [
            {
                index: true,
                Component: Homepage
            }
        ]
    },
    {
        Component: withAuth(DashboardLayout, role.rider as TRole),
        path: "/rider",
        children: [
            { index: true, element: <Navigate to="/rider/dashboard" /> },
            ...generateRoutes(riderSidebarItems),
        ],
    },
    {
        Component: withAuth(DashboardLayout, role.driver as TRole),
        path: "/driver",
        children: [
            { index: true, element: <Navigate to="/driver/dashboard" /> },
            ...generateRoutes(driverSidebarItems),
        ],
    },
    {
        path: "/sign-in",
        Component: Signin
    },
    {
        path: "/sign-up",
        Component: SignUp
    }
])