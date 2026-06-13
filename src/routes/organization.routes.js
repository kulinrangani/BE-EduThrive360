import { Router } from "express";
import * as orgController from "../controllers/organization.controller.js";
import { authenticate, requireRoles } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  addMemberValidator,
  createOrganizationValidator,
  listMembersQueryValidator,
  memberIdValidator,
  organizationIdValidator,
  updateMemberValidator,
  updateOrganizationValidator,
} from "../validators/organization.validators.js";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  requireRoles("super_admin"),
  createOrganizationValidator,
  validate,
  orgController.create,
);

router.get("/", requireRoles("super_admin"), orgController.list);

router.get(
  "/me",
  requireRoles("org_admin", "org_counselor"),
  orgController.getMe,
);

router.patch(
  "/:id",
  requireRoles("super_admin"),
  updateOrganizationValidator,
  validate,
  orgController.update,
);

router.get(
  "/:id/members",
  requireRoles("super_admin", "org_admin", "org_counselor"),
  listMembersQueryValidator,
  validate,
  orgController.listMembers,
);

router.get(
  "/:id/members/:userId",
  requireRoles("super_admin", "org_admin", "org_counselor"),
  memberIdValidator,
  validate,
  orgController.getMember,
);

router.patch(
  "/:id/members/:userId",
  requireRoles("super_admin", "org_admin"),
  updateMemberValidator,
  validate,
  orgController.updateMember,
);

router.delete(
  "/:id/members/:userId",
  requireRoles("super_admin", "org_admin"),
  memberIdValidator,
  validate,
  orgController.deleteMember,
);

router.get(
  "/:id",
  requireRoles("super_admin", "org_admin"),
  organizationIdValidator,
  validate,
  orgController.getById,
);

router.post(
  "/:id/members",
  requireRoles("super_admin", "org_admin"),
  addMemberValidator,
  validate,
  orgController.addMember,
);

router.delete(
  "/:id",
  requireRoles("super_admin"),
  organizationIdValidator,
  validate,
  orgController.deleteOrg,
);

export default router;


