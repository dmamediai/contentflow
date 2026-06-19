import axios, { AxiosError, AxiosInstance } from "axios";
import { getSession } from "next-auth/react";

// Use dedicated API URL for production, fall back to local for development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

let apiClient: AxiosInstance | null = null;

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor to add auth token
  client.interceptors.request.use(
    async (config) => {
      const session = await getSession();
      if (session?.user?.email) {
        config.headers.Authorization = `Bearer ${session.user.email}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor to handle errors
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        // Handle unauthorized - redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
}

export function getApiClient(): AxiosInstance {
  if (!apiClient) {
    apiClient = createApiClient();
  }
  return apiClient;
}

// Convenience methods
export const api = {
  get: (url: string, config?: any) => getApiClient().get(url, config),
  post: (url: string, data?: any, config?: any) =>
    getApiClient().post(url, data, config),
  put: (url: string, data?: any, config?: any) =>
    getApiClient().put(url, data, config),
  patch: (url: string, data?: any, config?: any) =>
    getApiClient().patch(url, data, config),
  delete: (url: string, config?: any) => getApiClient().delete(url, config),
};
