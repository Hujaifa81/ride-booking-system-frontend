import { baseApi } from "@/redux/baseApi";

export const vehicleApi=baseApi.injectEndpoints(
    {
        endpoints:(builder)=>({
        createVehicle:builder.mutation({
            query:(vehicleData)=>({
                url:"/vehicle/create",
                method:"POST",
                data:vehicleData,
            }),
        })
    })}
)
;

export const {useCreateVehicleMutation}=vehicleApi;