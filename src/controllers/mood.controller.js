import { MoodCheckIn } from "../models/MoodCheckIn.js";
import { AppError, sendError } from "../utils/errors.js";

export async function create(req, res, next) {
  try {
    const userId = req.user._id;
    const { score, note } = req.body;
    
    if (score === undefined || score === null) {
      throw new AppError(400, "Mood score is required");
    }
    
    const parsedScore = Number(score);
    if (isNaN(parsedScore) || parsedScore < 1 || parsedScore > 5) {
      throw new AppError(400, "Invalid mood score. Must be a number between 1 and 5.");
    }

    const checkIn = await MoodCheckIn.create({
      userId,
      score: parsedScore,
      note: note || "",
    });

    res.status(201).json(checkIn);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message, err.details);
    }
    next(err);
  }
}

export async function getHistory(req, res, next) {
  try {
    const userId = req.user._id;
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 100) : 30;
    
    const history = await MoodCheckIn.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(history);
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, err.statusCode, err.message, err.details);
    }
    next(err);
  }
}
