import { baseApi } from "@/redux/baseApi";

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

    }),
});

    export const { useCreateDriverMutation, useGetDriverProfileQuery,useUpdateDriverStatusMutation } = driverApi;