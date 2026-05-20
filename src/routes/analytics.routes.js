import { Router } from "express";
import * as analyticsController from "../controllers/analytics.controller.js";
import { authenticate, requireRoles } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { query } from "express-validator";

const router = Router();
const analyticsRoles = requireRoles("super_admin", "org_admin", "org_counselor");

const orgQueryValidator = [
  query("organizationId").optional().isMongoId().withMessage("Invalid organizationId"),
];

router.use(authenticate, analyticsRoles);

router.get("/overall", orgQueryValidator, validate, analyticsController.overall);
router.get("/group-wise", orgQueryValidator, validate, analyticsController.groupWise);
router.get(
  "/high-risk-users",
  [
    ...orgQueryValidator,
    query("limit").optional().isInt({ min: 1, max: 50 }),
  ],
  validate,
  analyticsController.highRiskUsers,
);

export default router;
