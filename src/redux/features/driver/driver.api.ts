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

    }),
});

export const { useCreateDriverMutation, useGetDriverProfileQuery, useUpdateDriverStatusMutation, useUpdateDriverLocationMutation } = driverApi;