import { Router } from "express";
import * as quizController from "../controllers/quiz.controller.js";
import { authenticate, requireRoles } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createQuoteValidator,
  quoteIdValidator,
  updateQuoteValidator,
} from "../validators/quiz.validators.js";

const router = Router();
const quoteRoles = requireRoles("super_admin", "org_admin");

router.use(authenticate);

router.get("/", quoteRoles, quizController.listQuotes);
router.post("/", quoteRoles, createQuoteValidator, validate, quizController.createQuote);
router.patch(
  "/:id",
  quoteRoles,
  [...quoteIdValidator, ...updateQuoteValidator],
  validate,
  quizController.updateQuote,
);
router.delete("/:id", quoteRoles, quoteIdValidator, validate, quizController.deleteQuote);

export default router;
