import { validationResult } from "express-validator";
import { sendError } from "../utils/errors.js";

export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, "Validation failed", errors.array());
  }
  next();
}
