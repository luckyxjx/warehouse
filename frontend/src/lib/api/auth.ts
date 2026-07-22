import { apiClient } from "./client";
import { ApiSuccess, User } from "@/types/api";

export async function registerApi(input: { name: string; email: string; password: string }) {
  const { data } = await apiClient.post<ApiSuccess<{ user: User; token: string }>>("/auth/register", input);
  return data.data;
}

export async function loginApi(input: { email: string; password: string }) {
  const { data } = await apiClient.post<ApiSuccess<{ user: User; token: string }>>("/auth/login", input);
  return data.data;
}

export async function getMeApi() {
  const { data } = await apiClient.get<ApiSuccess<User>>("/auth/me");
  return data.data;
}
