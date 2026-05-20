import * as quizService from "../services/quiz.service.js";
import { AppError } from "../utils/errors.js";
import { sendError } from "../utils/errors.js";

function handle(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      if (err instanceof AppError) {
        return sendError(res, err.statusCode, err.message, err.details);
      }
      next(err);
    }
  };
}

export const listQuizzes = handle(async (req, res) => {
  const quizzes = await quizService.listQuizzes(req.user, req.query);
  res.json({ quizzes });
});

export const createQuiz = handle(async (req, res) => {
  const quiz = await quizService.createQuiz(req.body, req.user);
  res.status(201).json({ quiz });
});

export const getQuiz = handle(async (req, res) => {
  const includeTree = req.query.include === "tree";
  const quiz = await quizService.getQuizById(req.params.id, req.user, { includeTree });
  res.json({ quiz });
});

export const updateQuiz = handle(async (req, res) => {
  const quiz = await quizService.updateQuiz(req.params.id, req.body, req.user);
  res.json({ quiz });
});

export const deleteQuiz = handle(async (req, res) => {
  const result = await quizService.deleteQuiz(req.params.id, req.user);
  res.json(result);
});

export const listGroups = handle(async (req, res) => {
  const groups = await quizService.listGroups(req.params.id, req.user);
  res.json({ groups });
});

export const createGroup = handle(async (req, res) => {
  const group = await quizService.createGroup(req.params.id, req.body, req.user);
  res.status(201).json({ group });
});

export const updateGroup = handle(async (req, res) => {
  const group = await quizService.updateGroup(
    req.params.id,
    req.params.groupId,
    req.body,
    req.user,
  );
  res.json({ group });
});

export const deleteGroup = handle(async (req, res) => {
  const result = await quizService.deleteGroup(
    req.params.id,
    req.params.groupId,
    req.user,
  );
  res.json(result);
});

export const listQuestions = handle(async (req, res) => {
  const questions = await quizService.listQuestions(
    req.params.id,
    req.params.groupId,
    req.user,
  );
  res.json({ questions });
});

export const createQuestion = handle(async (req, res) => {
  const question = await quizService.createQuestion(
    req.params.id,
    req.params.groupId,
    req.body,
    req.user,
  );
  res.status(201).json({ question });
});

export const updateQuestion = handle(async (req, res) => {
  const question = await quizService.updateQuestion(
    req.params.id,
    req.params.groupId,
    req.params.questionId,
    req.body,
    req.user,
  );
  res.json({ question });
});

export const deleteQuestion = handle(async (req, res) => {
  const result = await quizService.deleteQuestion(
    req.params.id,
    req.params.groupId,
    req.params.questionId,
    req.user,
  );
  res.json(result);
});

export const listQuotes = handle(async (req, res) => {
  const quotes = await quizService.listQuotes(req.user, req.query);
  res.json({ quotes });
});

export const createQuote = handle(async (req, res) => {
  const quote = await quizService.createQuote(req.body, req.user);
  res.status(201).json({ quote });
});

export const updateQuote = handle(async (req, res) => {
  const quote = await quizService.updateQuote(req.params.id, req.body, req.user);
  res.json({ quote });
});

export const deleteQuote = handle(async (req, res) => {
  const result = await quizService.deleteQuote(req.params.id, req.user);
  res.json(result);
});
