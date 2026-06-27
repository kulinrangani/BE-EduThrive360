import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import organizationRoutes from "./organization.routes.js";
import quizRoutes from "./quiz.routes.js";
import quoteRoutes from "./quote.routes.js";
import attemptRoutes from "./attempt.routes.js";
import resultRoutes from "./result.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import usersRoutes from "./users.routes.js";
import moodRoutes from "./mood.routes.js";
import searchRoutes from "./search.routes.js";

const router = Router();

router.use(healthRoutes);
router.use("/auth", authRoutes);
router.use("/organizations", organizationRoutes);
router.use("/quizzes", quizRoutes);
router.use("/quotes", quoteRoutes);
router.use("/attempts", attemptRoutes);
router.use("/results", resultRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/users", usersRoutes);
router.use("/mood", moodRoutes);
router.use("/search", searchRoutes);

export default router;
