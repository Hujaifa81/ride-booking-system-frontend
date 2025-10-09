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
    })
});

export const { useRequestRideMutation } = rideApi;
