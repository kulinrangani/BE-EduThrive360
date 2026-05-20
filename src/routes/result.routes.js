import { Router } from "express";
import * as resultController from "../controllers/result.controller.js";
import { authenticate, requireRoles } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { attemptIdValidator } from "../validators/attempt.validators.js";
import { param, query } from "express-validator";

const router = Router();
const staffRoles = requireRoles("super_admin", "org_admin", "org_counselor");

router.use(authenticate);

router.get(
  "/me",
  requireRoles("user"),
  resultController.listMyResults,
);

router.get(
  "/org/:organizationId",
  staffRoles,
  param("organizationId").isMongoId(),
  validate,
  resultController.listOrgResults,
);

router.get(
  "/org",
  staffRoles,
  query("organizationId").optional().isMongoId(),
  validate,
  resultController.listOrgResultsScoped,
);

router.get(
  "/:id",
  param("id").isMongoId(),
  validate,
  resultController.getResult,
);

export default router;
