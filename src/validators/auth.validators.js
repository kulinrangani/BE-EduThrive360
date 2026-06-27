import { body } from "express-validator";

export const registerValidator = [
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("role")
    .optional()
    .isIn(["super_admin", "user"])
    .withMessage("Invalid role"),
  body("organizationCode")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Organization code cannot be empty"),
  body("organizationId")
    .optional()
    .isMongoId()
    .withMessage("Invalid organization id"),
  body("memberType")
    .optional()
    .isIn(["student", "employee"])
    .withMessage("Invalid member type"),
  body("age").optional().isInt({ min: 0, max: 120 }),
  body("gender").optional().trim(),
];

export const loginValidator = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

export const forgotPasswordValidator = [
  body("email").isEmail().withMessage("Valid email is required"),
];

export const resetPasswordValidator = [
  body("token").trim().notEmpty().withMessage("Reset token is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

export const updateProfileValidator = [
  body("fullName").optional().trim().notEmpty().withMessage("Full name cannot be empty"),
  body("email").optional().isEmail().withMessage("Valid email is required"),
  body("phoneNumber").optional().trim(),
  body("avatarUrl").optional().trim(),
  body("password")
    .optional()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];
