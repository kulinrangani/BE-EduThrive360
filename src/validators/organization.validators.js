import { body, param, query } from "express-validator";

export const createOrganizationValidator = [
  body("name").trim().notEmpty().withMessage("Organization name is required"),
  body("type")
    .isIn(["school", "corporate"])
    .withMessage("Type must be school or corporate"),
  body("settings").optional().isObject(),
  body("admin.fullName").trim().notEmpty().withMessage("Admin full name is required"),
  body("admin.email").isEmail().withMessage("Valid admin email is required"),
  body("admin.password")
    .isLength({ min: 8 })
    .withMessage("Admin password must be at least 8 characters"),
];

export const organizationIdValidator = [
  param("id").isMongoId().withMessage("Invalid organization id"),
];

export const updateOrganizationValidator = [
  param("id").isMongoId().withMessage("Invalid organization id"),
  body("name").optional().trim().notEmpty(),
  body("type").optional().isIn(["school", "corporate"]),
  body("settings").optional().isObject(),
  body("status").optional().isBoolean(),
];


export const memberIdValidator = [
  param("id").isMongoId().withMessage("Invalid organization id"),
  param("userId").isMongoId().withMessage("Invalid user id"),
];

export const updateMemberValidator = [
  param("id").isMongoId().withMessage("Invalid organization id"),
  param("userId").isMongoId().withMessage("Invalid user id"),
  body("fullName").optional().trim().notEmpty(),
  body("email").optional().isEmail(),
  body("status").optional().isIn(["active", "inactive"]),
  body("password")
    .optional()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

export const listMembersQueryValidator = [
  param("id").isMongoId().withMessage("Invalid organization id"),
  query("role")
    .optional()
    .isIn(["org_counselor", "user", "org_admin"])
    .withMessage("Invalid role filter"),
];

export const addMemberValidator = [
  param("id").isMongoId().withMessage("Invalid organization id"),
  body("fullName").trim().notEmpty().withMessage("Full name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("role")
    .optional()
    .isIn(["org_counselor", "user"])
    .withMessage("Role must be org_counselor or user"),
  body("memberType")
    .optional()
    .isIn(["student", "employee"])
    .withMessage("Invalid member type"),
  body("age").optional().isInt({ min: 0, max: 120 }),
  body("gender").optional().trim(),
];
