import { baseApi } from "@/redux/baseApi";
import type { IFareRequest, IFareResponse, IResponse, ITotalRidesCount, Ride } from "@/types";


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
            invalidatesTags: ["RIDE", "RIDE_STATS"],
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
            providesTags: ['RIDE_STATS'],

        }),

        getRideHistory: builder.query<
            IResponse<Ride[]>,
            { userId: string; params?: Record<string, string | number | boolean> }
        >({
            query: ({ userId, params }) => ({
                url: `/ride/history/${userId}`,
                method: "GET",
                params,
            }),
            providesTags: ["RIDE"],
        }),

        getIncomingRides: builder.query<IResponse<Ride[]>, void>({
            query: () => ({
                url: `/ride/incoming-requests`,
                method: "GET",
            }),
            providesTags: ["RIDE"],
        }),

        acceptRide: builder.mutation<IResponse<Ride>, string>({
            query: (rideId: string) => ({
                url: `/ride/accept/${rideId}`,
                method: "PATCH",
            }),
            invalidatesTags: ["RIDE"],
        }),

        rejectRide: builder.mutation<IResponse<Ride>, string>({
            query: (rideId: string) => ({
                url: `/ride/reject/${rideId}`,
                method: "PATCH",
            }),
            invalidatesTags: ["RIDE"],
        }),

        updateRideStatusAfterAccepted:builder.mutation<IResponse<Ride>, { rideId: string; status: string }>({
            query: ({ rideId, status }) => ({
                url: `/ride/status-change/${rideId}`,
                method: "PATCH",
                data: { status },
            }),
            invalidatesTags: ["RIDE"],
        }),
    })
});

export const { useRequestRideMutation, useActiveRideQuery, useCancelRideMutation, useGetApproximateFareQuery, useGetTotalRidesCountQuery, useGetRideHistoryQuery, useGetIncomingRidesQuery, useAcceptRideMutation, useRejectRideMutation,useUpdateRideStatusAfterAcceptedMutation } = rideApi;
