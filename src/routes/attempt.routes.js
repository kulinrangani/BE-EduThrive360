import { Router } from "express";
import * as attemptController from "../controllers/attempt.controller.js";
import * as resultController from "../controllers/result.controller.js";
import { authenticate, requireRoles } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  attemptIdValidator,
  saveAnswersValidator,
  startAttemptValidator,
} from "../validators/attempt.validators.js";
import { param } from "express-validator";

const router = Router();
const userOnly = requireRoles("user");

router.use(authenticate);

router.get("/quizzes", userOnly, attemptController.listPublishedQuizzes);
router.get(
  "/quizzes/:quizId",
  userOnly,
  param("quizId").isMongoId(),
  validate,
  attemptController.getQuizForPlay,
);

router.post("/start", userOnly, startAttemptValidator, validate, attemptController.startAttempt);
router.get(
  "/:id/result",
  attemptIdValidator,
  validate,
  resultController.getAttemptResult,
);
router.get("/:id", userOnly, attemptIdValidator, validate, attemptController.getAttempt);
router.patch(
  "/:id/answers",
  userOnly,
  [...attemptIdValidator, ...saveAnswersValidator],
  validate,
  attemptController.saveAnswers,
);
router.post(
  "/:id/submit",
  userOnly,
  attemptIdValidator,
  validate,
  attemptController.submitAttempt,
);

export default router;
