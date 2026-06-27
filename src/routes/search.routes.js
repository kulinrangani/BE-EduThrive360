import { Router } from "express";
import * as searchController from "../controllers/search.controller.js";
import { authenticate, requireRoles } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", authenticate, requireRoles("super_admin"), searchController.globalSearch);

export default router;
