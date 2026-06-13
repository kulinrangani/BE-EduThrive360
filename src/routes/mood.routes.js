import { Router } from "express";
import * as moodController from "../controllers/mood.controller.js";
import { authenticate, requireRoles } from "../middleware/auth.middleware.js";

const router = Router();

router.use(authenticate);

router.post("/", requireRoles("user"), moodController.create);
router.get("/history", requireRoles("user"), moodController.getHistory);

export default router;
