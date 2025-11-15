import { baseApi } from "@/redux/baseApi";

export const adminApi=baseApi.injectEndpoints({
    endpoints:(builder)=>({
        getAdminDashboardSummary:builder.query({
            query:({params})=>({
                url:"/analytics/dashboard-summary",
                method:"GET",
                params
            }),
            providesTags:["ADMIN_DASHBOARD_SUMMARY"],
        }),
    }),
});
export const {useGetAdminDashboardSummaryQuery}=adminApi;