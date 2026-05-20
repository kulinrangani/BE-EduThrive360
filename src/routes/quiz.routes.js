import { Router } from "express";
import * as quizController from "../controllers/quiz.controller.js";
import { authenticate, requireRoles } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createGroupValidator,
  createQuestionValidator,
  createQuizValidator,
  createQuoteValidator,
  groupIdValidator,
  listQuizzesQueryValidator,
  questionIdValidator,
  quizIdValidator,
  quoteIdValidator,
  updateGroupValidator,
  updateQuestionValidator,
  updateQuizValidator,
  updateQuoteValidator,
} from "../validators/quiz.validators.js";

const router = Router();
const quizRoles = requireRoles("super_admin", "org_admin");

router.use(authenticate);

router.get(
  "/",
  quizRoles,
  listQuizzesQueryValidator,
  validate,
  quizController.listQuizzes,
);
router.post("/", quizRoles, createQuizValidator, validate, quizController.createQuiz);
router.get(
  "/:id",
  quizRoles,
  quizIdValidator,
  validate,
  quizController.getQuiz,
);
router.patch(
  "/:id",
  quizRoles,
  [...quizIdValidator, ...updateQuizValidator],
  validate,
  quizController.updateQuiz,
);
router.delete(
  "/:id",
  quizRoles,
  quizIdValidator,
  validate,
  quizController.deleteQuiz,
);

router.get(
  "/:id/groups",
  quizRoles,
  quizIdValidator,
  validate,
  quizController.listGroups,
);
router.post(
  "/:id/groups",
  quizRoles,
  [...quizIdValidator, ...createGroupValidator],
  validate,
  quizController.createGroup,
);
router.patch(
  "/:id/groups/:groupId",
  quizRoles,
  [...quizIdValidator, ...groupIdValidator, ...updateGroupValidator],
  validate,
  quizController.updateGroup,
);
router.delete(
  "/:id/groups/:groupId",
  quizRoles,
  [...quizIdValidator, ...groupIdValidator],
  validate,
  quizController.deleteGroup,
);

router.get(
  "/:id/groups/:groupId/questions",
  quizRoles,
  [...quizIdValidator, ...groupIdValidator],
  validate,
  quizController.listQuestions,
);
router.post(
  "/:id/groups/:groupId/questions",
  quizRoles,
  [...quizIdValidator, ...groupIdValidator, ...createQuestionValidator],
  validate,
  quizController.createQuestion,
);
router.patch(
  "/:id/groups/:groupId/questions/:questionId",
  quizRoles,
  [...quizIdValidator, ...groupIdValidator, ...questionIdValidator, ...updateQuestionValidator],
  validate,
  quizController.updateQuestion,
);
router.delete(
  "/:id/groups/:groupId/questions/:questionId",
  quizRoles,
  [...quizIdValidator, ...groupIdValidator, ...questionIdValidator],
  validate,
  quizController.deleteQuestion,
);

export default router;
