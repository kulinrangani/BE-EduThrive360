import { body, param } from "express-validator";

export const attemptIdValidator = [
  param("id").isMongoId().withMessage("Invalid attempt id"),
];

export const startAttemptValidator = [
  body("quizId").isMongoId().withMessage("quizId is required"),
];

export const saveAnswersValidator = [
  body("answers").isArray({ min: 1 }).withMessage("answers array is required"),
  body("answers.*.questionId").isMongoId(),
  body("answers.*.selectedValue").isInt({ min: 1, max: 4 }),
];
