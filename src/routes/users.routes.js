import { Router } from "express";
import * as resultController from "../controllers/result.controller.js";
import { authenticate, requireRoles } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/me/results", requireRoles("user"), resultController.listMyResults);

export default router;
