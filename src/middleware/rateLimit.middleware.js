const windowMs = 15 * 60 * 1000;
const maxAttempts = 30;

const store = new Map();

function clientKey(req) {
  return req.ip ?? req.socket?.remoteAddress ?? "unknown";
}

/**
 * Lightweight in-memory rate limiter for auth routes (no extra dependency).
 */
export function authRateLimit(req, res, next) {
  const key = clientKey(req);
  const now = Date.now();
  let entry = store.get(key);

  if (!entry || now - entry.start > windowMs) {
    entry = { start: now, count: 0 };
  }

  entry.count += 1;
  store.set(key, entry);

  if (entry.count > maxAttempts) {
    return res.status(429).json({
      error: "Too many requests. Try again in a few minutes.",
    });
  }

  next();
}
