import { apiClient } from "@/lib/api-client";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginInput = z.infer<typeof loginSchema>;

export async function loginApi(input: LoginInput) {
  const response = await apiClient.post("/auth/login", input);
  return response.data;
}

export async function logoutApi() {
  await apiClient.post("/auth/logout");
}
