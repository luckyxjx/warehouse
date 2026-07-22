"use client";

import axios from "axios";
import { clearToken, getToken, isTokenExpired } from "./token";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    if (isTokenExpired(token)) {
      clearToken();
      if (typeof window !== "undefined") {
        window.location.assign("/login");
      }
      return config;
    }

    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.message ?? error.message;
  }

  return "Something went wrong";
}
