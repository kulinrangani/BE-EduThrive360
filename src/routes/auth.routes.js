import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  forgotPasswordValidator,
  loginValidator,
  registerValidator,
  resetPasswordValidator,
  updateProfileValidator,
} from "../validators/auth.validators.js";
import { authRateLimit } from "../middleware/rateLimit.middleware.js";

const router = Router();

router.post("/register", authRateLimit, registerValidator, validate, authController.register);
router.post("/login", authRateLimit, loginValidator, validate, authController.login);
router.post(
  "/forgot-password",
  authRateLimit,
  forgotPasswordValidator,
  validate,
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  authRateLimit,
  resetPasswordValidator,
  validate,
  authController.resetPassword,
);
router.get("/profile", authenticate, authController.profile);
router.put("/profile", authenticate, updateProfileValidator, validate, authController.updateProfile);

export default router;
