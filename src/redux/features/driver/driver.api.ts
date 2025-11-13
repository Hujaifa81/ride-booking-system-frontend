import { baseApi } from "@/redux/baseApi";
import type { Driver, IResponse, UpdateDriverLocation } from "@/types";

export const driverApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        createDriver: builder.mutation({
            query: (driverData) => ({
                url: "/driver/create",
                method: "POST",
                data: driverData,
            }),
        }),
        getDriverProfile: builder.query({
            query: () => ({
                url: "/driver/my-driver-profile",
                method: "GET",
            }),
            providesTags: ["DRIVER"],
        }),
        UpdateDriverStatus: builder.mutation({
            query: (statusData) => ({
                url: "/driver/availability-status",
                method: "PATCH",
                data: statusData,
            }),
            invalidatesTags: ["DRIVER"],

        }),
        updateDriverLocation: builder.mutation<IResponse<Driver>, UpdateDriverLocation>({
            query: ({ coordinates }) => ({
                url: "/driver/location",
                method: "PATCH",
                data: {
                    location: { type: "Point", coordinates },
                },
            }),
            invalidatesTags: ["DRIVER"],
        }),
        getDashboardMetrics: builder.query({
            query: () => ({
                url: "/driver/dashboard-metrics",
                method: "GET",
            }),
            providesTags: ["DASHBOARD_METRICS"],
        }),
        getEarningsAnalytics: builder.query({
            query: ({params}) => ({
                url: `/driver/earnings-analytics`,
                method: "GET",
                params
            }),
            providesTags: ["EARNINGS_ANALYTICS"],
        }),
        getPeakEarningHours: builder.query({
            query: () => ({
                url: `/driver/peak-earning-hours`,
                method: "GET",
            }),
            providesTags: ["EARNINGS_ANALYTICS"],
        }),
        getTopRoutes: builder.query({
            query: () => ({
                url: `/driver/top-earning-routes`,
                method: "GET",
            }),
            providesTags: ["EARNINGS_ANALYTICS"],
        }),

    }),
});

export const { useCreateDriverMutation, useGetDriverProfileQuery, useUpdateDriverStatusMutation, useUpdateDriverLocationMutation,useGetDashboardMetricsQuery,useGetEarningsAnalyticsQuery,useGetPeakEarningHoursQuery,useGetTopRoutesQuery } = driverApi;