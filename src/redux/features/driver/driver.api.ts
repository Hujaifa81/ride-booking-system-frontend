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
    }),

}
);

export const { useCreateDriverMutation,useGetDriverProfileQuery } = driverApi;