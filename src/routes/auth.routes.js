import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
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

// Ensure uploads folder exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads", { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

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
router.put(
  "/profile",
  authenticate,
  upload.single("avatar"),
  updateProfileValidator,
  validate,
  authController.updateProfile
);

export default router;
