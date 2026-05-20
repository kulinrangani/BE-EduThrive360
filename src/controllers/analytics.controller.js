import * as analyticsService from "../services/analytics.service.js";
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

export const overall = handle(async (req, res) => {
  const data = await analyticsService.getOverallAnalytics(req.user, req.query);
  res.json(data);
});

export const groupWise = handle(async (req, res) => {
  const groups = await analyticsService.getGroupWiseAnalytics(req.user, req.query);
  res.json({ groups });
});

export const highRiskUsers = handle(async (req, res) => {
  const users = await analyticsService.getHighRiskUsers(req.user, req.query);
  res.json({ users });
});
