import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
  COOKIE_SECURE: z
    .string()
    .default("false")
    .transform((value) => value === "true"),
  MAX_UPLOAD_MB: z.coerce.number().default(20),
  MIN_IMAGE_WIDTH: z.coerce.number().default(1920),
  MIN_IMAGE_HEIGHT: z.coerce.number().default(1080)
});

export const env = envSchema.parse(process.env);

export const corsOrigins = env.CORS_ORIGINS.split(",").map((origin) => origin.trim());
