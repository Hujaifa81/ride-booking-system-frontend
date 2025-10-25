import { baseApi } from "@/redux/baseApi";
import type { IFareRequest, IFareResponse, IResponse, ITotalRidesCount } from "@/types";

export const rideApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        requestRide: builder.mutation({
            query: (rideData) => ({
                url: "/ride/create",
                method: "POST",
                data: rideData,
            }),
            invalidatesTags: ["RIDE"],
        }),

        activeRide: builder.query({
            query: () => ({
                url: "/ride/active-ride",
                method: "GET",
            }),
            providesTags: ["RIDE"],
        }),

        cancelRide: builder.mutation({
            query: ({ rideId, canceledReason }: { rideId: string, canceledReason?: string }) => ({
                url: `/ride/cancel/${rideId}`,
                method: "PATCH",
                data: { canceledReason },
            }),
            invalidatesTags: ["RIDE"],
        }),

        getApproximateFare: builder.query<IResponse<IFareResponse>, IFareRequest>({
            query: ({ pickupLocation, dropoffLocation }: {
                pickupLocation: string,
                dropoffLocation: string
            }) => ({
                url: `/ride/approximate-fare?pickupLocation=${pickupLocation}&dropoffLocation=${dropoffLocation}`,
                method: "GET",

            }),
            providesTags: ["RIDE"]
        }),

        getTotalRidesCount: builder.query<IResponse<ITotalRidesCount>, string>({
            query: (userId) => ({
                url: `/ride/total-rides/${userId}`,
                method: 'GET',
            }),
            providesTags: ['RIDE'],
            
        }),

    })
});

export const { useRequestRideMutation, useActiveRideQuery, useCancelRideMutation, useGetApproximateFareQuery, useGetTotalRidesCountQuery } = rideApi;
