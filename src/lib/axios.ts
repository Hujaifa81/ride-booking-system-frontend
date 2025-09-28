
import config from "@/config";
import axios from "axios";


export const axiosInstance = axios.create({
    baseURL: config.baseUrl,
    withCredentials: true,
});

// Request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        // Modify config if needed (e.g., add headers)
        return config;
    },
    (error) => Promise.reject(error)
);

let isRefreshing = false;
let pendingQueue: { resolve: (value?: unknown) => void; reject: (err?: unknown) => void }[] = [];

const processQueue = (error?: unknown) => {
    pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
    pendingQueue = [];
};

// Response interceptor
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (
            error.response?.status === 500 &&
            error.response?.data?.message === "jwt expired" &&
            originalRequest &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    pendingQueue.push({ resolve, reject });
                }).then(() => axiosInstance(originalRequest));
            }

            isRefreshing = true;
            try {
                await axiosInstance.post("/auth/refresh-token");

                processQueue(null);
                return axiosInstance(originalRequest);
            } catch (err) {
                processQueue(err);
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);
