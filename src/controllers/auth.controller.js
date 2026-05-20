import * as authService from "../services/auth.service.js";
import { AppError } from "../utils/errors.js";
import { sendError } from "../utils/errors.js";

export async function register(req, res, next) {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message, err.details);
    }
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const result = await authService.loginUser(req.body.email, req.body.password);
    res.json(result);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message, err.details);
    }
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const result = await authService.requestPasswordReset(req.body.email);
    res.json(result);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message, err.details);
    }
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const result = await authService.resetPassword(req.body.token, req.body.password);
    res.json(result);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message, err.details);
    }
    next(err);
  }
}

export async function profile(req, res, next) {
  try {
    const user = await authService.getProfile(req.user._id);
    res.json({ user });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message, err.details);
    }
    next(err);
  }
}
