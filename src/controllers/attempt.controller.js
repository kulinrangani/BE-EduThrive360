import * as attemptService from "../services/attempt.service.js";
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

export const listPublishedQuizzes = handle(async (req, res) => {
  const quizzes = await attemptService.listPublishedQuizzes(req.user);
  res.json({ quizzes });
});

export const getQuizForPlay = handle(async (req, res) => {
  const quiz = await attemptService.getPublishedQuizForPlay(req.params.quizId, req.user);
  res.json({ quiz });
});

export const startAttempt = handle(async (req, res) => {
  const attempt = await attemptService.startAttempt(req.body.quizId, req.user);
  res.status(201).json({ attempt });
});

export const getAttempt = handle(async (req, res) => {
  const attempt = await attemptService.getAttempt(req.params.id, req.user);
  res.json({ attempt });
});

export const saveAnswers = handle(async (req, res) => {
  const attempt = await attemptService.saveAttemptAnswers(
    req.params.id,
    req.body,
    req.user,
  );
  res.json({ attempt });
});

export const submitAttempt = handle(async (req, res) => {
  const payload = await attemptService.submitAttempt(req.params.id, req.user);
  res.json(payload);
});
