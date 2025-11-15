import { createApi } from "@reduxjs/toolkit/query/react";
import axiosBaseQuery from "./axiosBaseQuery";


export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["RIDER", "DRIVER", "ADMIN", "USER", "RIDE", "RIDE_STATS", "VEHICLE", "INCOMING_RIDES", "ACTIVE_RIDE", "DASHBOARD_METRICS", "EARNINGS_ANALYTICS", "ADMIN_DASHBOARD_SUMMARY"],
  endpoints: () => ({}),
});