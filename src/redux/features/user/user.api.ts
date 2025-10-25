import { baseApi } from "@/redux/baseApi";
import type { IResponse, User } from "@/types";
import type { IUpdateUserRequest } from "@/types/user.type";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    updateUser: builder.mutation<IResponse<User>, IUpdateUserRequest>({
      query: ({ userId, body }) => {
        return {
          url: `/user/${userId}`,
          method: "PATCH",
          data:body
        };
      },
      invalidatesTags: ['USER'],
    }),
  }),
});
export const { useUpdateUserMutation } = userApi;
