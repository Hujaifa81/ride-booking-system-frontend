import App from "@/App";
import Homepage from "@/pages/Homepage";
import Signin from "@/pages/Signin";
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
        path: "/signin",
        Component: Signin
    }
])