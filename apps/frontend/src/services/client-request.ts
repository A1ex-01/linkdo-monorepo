import axios, { AxiosError, AxiosRequestConfig } from "axios";
import toast from "react-hot-toast";
import { createLogger } from "@/utils/logger";

const logger = createLogger("client-request");
const TOKEN_KEY = "linkdo_token";

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || "62ec6a2c39a211f1a1036c58743dd36e";
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const instance = axios.create({
  baseURL: "http://localhost:8080",
  timeout: 50000,
});

instance.interceptors.request.use(
  async (config) => {
    const token = getToken();
    if (token) {
      config.headers.setAuthorization?.(`Bearer ${token}`);
    }
    return config;
  },
  (error: AxiosError) => {
    logger.error("Request error:", JSON.stringify(error));
    return Promise.reject(error);
  },
);

instance.interceptors.response.use(
  (res) => {
    const payload = res.data as ApiResponse<unknown>;
    if (payload && payload.success === false) {
      logger.error("API Error:", payload.error);
    }
    return res;
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.data?.error) {
      toast.error(error.response.data.error);
    }
    return Promise.reject(error);
  },
);

export function request<T>(
  config: AxiosRequestConfig<unknown>,
): Promise<ApiResponse<T>> {
  return instance.request<ApiResponse<T>>(config).then((res) => res.data);
}

export { getToken };
