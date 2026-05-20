export class AppError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function sendError(res, statusCode, message, details = null) {
  const body = { error: message };
  if (details) body.details = details;
  return res.status(statusCode).json(body);
}
