import { baseApi } from "@/redux/baseApi";

export const adminApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAdminDashboardSummary: builder.query({
            query: ({ params }) => ({
                url: "/analytics/dashboard-summary",
                method: "GET",
                params
            }),
            providesTags: ["ADMIN_DASHBOARD_SUMMARY"],
        }),
        getAdminAnalytics: builder.query({
            query: ({ params }) => ({
                url: "/analytics/advanced",
                method: "GET",
                params
            }),
            providesTags: ["ADMIN_ANALYTICS"],
        }),
    }),
});
export const { useGetAdminDashboardSummaryQuery, useGetAdminAnalyticsQuery } = adminApi;