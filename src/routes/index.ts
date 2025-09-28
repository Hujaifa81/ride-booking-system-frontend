import App from "@/App";
import Homepage from "@/pages/Homepage";
import Signin from "@/pages/Signin";
import SignUp from "@/pages/SignUp";
import { createBrowserRouter } from "react-router";

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
        path: "/sign-in",
        Component: Signin
    },
    {
        path: "/sign-up",
        Component:SignUp
    }
])