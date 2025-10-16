import { baseApi } from "@/redux/baseApi";

const rideApi=baseApi.injectEndpoints({
    endpoints:(builder)=>({
        requestRide:builder.mutation({
            query:(rideData)=>({
                url:"/ride/create",
                method:"POST",
                data:rideData,
            }),
            invalidatesTags:["RIDE"],
        }),

        activeRide:builder.query({
            query:()=>({
                url:"/ride/active-ride",
                method:"GET",
            }),
            providesTags:["RIDE"],
        }),

        cancelRide:builder.mutation({
            query:({rideId,canceledReason}:{rideId:string,canceledReason?:string})=>({
                url:`/ride/cancel/${rideId}`,
                method:"PATCH",
                data:{canceledReason},
            }),
            invalidatesTags:["RIDE"],
        }),
    })
});

export const { useRequestRideMutation, useActiveRideQuery, useCancelRideMutation } = rideApi;
