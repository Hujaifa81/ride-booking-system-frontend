import { baseApi } from "@/redux/baseApi";

export const vehicleApi = baseApi.injectEndpoints(
    {
        endpoints: (builder) => ({
            createVehicle: builder.mutation({
                query: (vehicleData) => ({
                    url: "/vehicle/create",
                    method: "POST",
                    data: vehicleData,
                }),
                invalidatesTags: ["VEHICLE"],
            }),
            getAllVehicles: builder.query({
                query: () => ({
                    url: `/vehicle/my-vehicles`,
                    method: "GET",
                }),
                providesTags: ["VEHICLE"],
            }),
            updateVehicleStatus: builder.mutation({
                query: ({ vehicleId }: { vehicleId: string }) => ({
                    url: `/vehicle/active-status-change/${vehicleId}`,
                    method: "PATCH",
                    
                }),
                invalidatesTags: ["VEHICLE"],
            }),
        })
    }
);

export const { useCreateVehicleMutation,useGetAllVehiclesQuery,useUpdateVehicleStatusMutation } = vehicleApi;