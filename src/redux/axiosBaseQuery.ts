/* eslint-disable @typescript-eslint/no-explicit-any */
import { axiosInstance } from "@/lib/axios";
import type { BaseQueryFn } from "@reduxjs/toolkit/query";


type AxiosConfigProps = {
  method?: string;
  data?: unknown;
  params?: Record<string, any>;
  headers?: Record<string, any>;
};



const axiosBaseQuery =
  (): BaseQueryFn<
    {
      url: string;
      method?: AxiosConfigProps["method"];
      data?: AxiosConfigProps["data"];
      params?: AxiosConfigProps["params"];
      headers?: AxiosConfigProps["headers"];
    },
    unknown,
    unknown
  > =>
  async ({ url, method, data, params, headers }) => {
    try {
      const result = await axiosInstance({
        url: url,
        method,
        data,
        params,
        headers,
      });
      return { data: result.data };
    } catch (axiosError) {
  const err = axiosError as any;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };

export default axiosBaseQuery;