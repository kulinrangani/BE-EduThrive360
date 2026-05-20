import { body, param, query } from "express-validator";

export const quizIdValidator = [param("id").isMongoId().withMessage("Invalid quiz id")];

export const groupIdValidator = [
  param("groupId").isMongoId().withMessage("Invalid group id"),
];

export const questionIdValidator = [
  param("questionId").isMongoId().withMessage("Invalid question id"),
];

export const quoteIdValidator = [param("id").isMongoId().withMessage("Invalid quote id")];

export const createQuizValidator = [
  body("organizationId").optional().isMongoId(),
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("description").optional().trim(),
  body("status").optional().isIn(["draft", "published", "archived"]),
  body("settings").optional().isObject(),
  body("settings.scoringModel")
    .optional()
    .isIn(["weighted", "raw", "normalized"]),
];

export const updateQuizValidator = [
  body("title").optional().trim().notEmpty(),
  body("description").optional().trim(),
  body("status").optional().isIn(["draft", "published", "archived"]),
  body("settings").optional().isObject(),
];

export const createGroupValidator = [
  body("name").trim().notEmpty().withMessage("Group name is required"),
  body("type").isIn(["positive", "negative"]).withMessage("Type must be positive or negative"),
  body("weight").optional().isFloat({ min: 0, max: 1 }),
  body("scoringMethod").optional().isIn(["average", "sum"]),
  body("riskRanges").optional().isArray(),
  body("order").optional().isInt({ min: 0 }),
];

export const updateGroupValidator = [
  body("name").optional().trim().notEmpty(),
  body("type").optional().isIn(["positive", "negative"]),
  body("weight").optional().isFloat({ min: 0, max: 1 }),
  body("scoringMethod").optional().isIn(["average", "sum"]),
  body("riskRanges").optional().isArray(),
  body("order").optional().isInt({ min: 0 }),
];

export const createQuestionValidator = [
  body("questionText").trim().notEmpty().withMessage("Question text is required"),
  body("options").optional().isArray({ min: 2 }),
  body("factorWeight").optional().isFloat({ min: 0 }),
  body("order").optional().isInt({ min: 0 }),
];

export const updateQuestionValidator = [
  body("questionText").optional().trim().notEmpty(),
  body("options").optional().isArray({ min: 2 }),
  body("factorWeight").optional().isFloat({ min: 0 }),
  body("order").optional().isInt({ min: 0 }),
];

export const createQuoteValidator = [
  body("organizationId").optional().isMongoId(),
  body("quizId").optional().isMongoId(),
  body("type").optional().isIn(["motivation", "support", "warning"]),
  body("riskLevel").isIn(["Low", "Medium", "High"]).withMessage("Invalid risk level"),
  body("message").trim().notEmpty().withMessage("Message is required"),
  body("minScore").optional().isFloat(),
  body("maxScore").optional().isFloat(),
];

export const updateQuoteValidator = [
  body("type").optional().isIn(["motivation", "support", "warning"]),
  body("riskLevel").optional().isIn(["Low", "Medium", "High"]),
  body("message").optional().trim().notEmpty(),
  body("quizId").optional({ nullable: true }).isMongoId(),
  body("minScore").optional().isFloat(),
  body("maxScore").optional().isFloat(),
];

export const listQuizzesQueryValidator = [
  query("organizationId").optional().isMongoId(),
  query("status").optional().isIn(["draft", "published", "archived"]),
];
