import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { loginRateLimit } from "../../middleware/rate-limit.middleware.js";
import { validateBody } from "../../middleware/validate.middleware.js";
import { authController } from "./auth.controller.js";
import { loginSchema } from "./auth.schema.js";

export const authRouter = Router();

authRouter.post("/login", loginRateLimit, validateBody(loginSchema), authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", requireAuth, authController.logout);
