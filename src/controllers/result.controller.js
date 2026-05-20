import * as resultService from "../services/result.service.js";
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

export const getAttemptResult = handle(async (req, res) => {
  const payload = await resultService.getAttemptResult(req.params.id, req.user);
  res.json(payload);
});

export const listMyResults = handle(async (req, res) => {
  const results = await resultService.listMyResults(req.user, req.query);
  res.json({ results });
});

export const getResult = handle(async (req, res) => {
  const result = await resultService.getResultById(req.params.id, req.user);
  res.json({ result });
});

export const listOrgResults = handle(async (req, res) => {
  const orgId = req.params.organizationId ?? req.query.organizationId;
  const results = await resultService.listOrgResults(orgId, req.user, req.query);
  res.json({ results });
});

export const listOrgResultsScoped = handle(async (req, res) => {
  const results = await resultService.listOrgResults(
    req.query.organizationId,
    req.user,
    req.query,
  );
  res.json({ results });
});
